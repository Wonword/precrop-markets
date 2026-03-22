// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PrecropNFT.sol";

/**
 * @title PrecropMarket
 * @notice Marketplace for Precrop micro-futures NFTs.
 *
 *  Primary sale flow:
 *    1. Farmer calls mintAndList()     → NFT minted into escrow.
 *    2. Buyer calls buy()              → 2.5% to platform, remainder to farmer.
 *    3. Buyer calls redeem()           → NFT burned, contract closed.
 *    4. Farmer calls cancelListing()   → NFT returned to farmer.
 *
 *  Secondary sale flow:
 *    1. Buyer calls relist()           → NFT transferred to escrow, secondary listing created.
 *    2. New buyer calls buySecondary() → 2.5% to platform + 2.5% to original farmer + remainder to seller.
 *    3. Seller calls cancelSecondaryListing() → NFT returned.
 *
 *  Fee schedule:
 *    - Primary:   2.5% platform fee (platformFeeBps)
 *    - Secondary: 2.5% platform fee + 2.5% original farmer royalty (farmerSecondaryRoyaltyBps)
 */
contract PrecropMarket is ReentrancyGuard, Ownable, IERC721Receiver {
    PrecropNFT public immutable nftContract;
    IERC20     public immutable usdc;

    // 2.5% to farmer via ERC-2981 (for external marketplace compatibility)
    uint96  public constant FARMER_ERC2981_BPS        = 250;

    // Platform fee on primary and secondary sales
    uint256 public platformFeeBps                     = 250;   // 2.5%

    // Additional farmer royalty on secondary sales (on top of platform fee)
    uint256 public farmerSecondaryRoyaltyBps          = 250;   // 2.5%

    address public feeRecipient;

    // ─── Primary listings (farmer → first buyer) ────────────────────────────
    struct Listing {
        address farmer;
        uint256 priceUsdc;
        bool    active;
    }
    mapping(uint256 => Listing) public listings;

    // ─── Secondary listings (buyer → next buyer) ────────────────────────────
    struct SecondaryListing {
        address seller;     // current owner relisting
        uint256 priceUsdc;
        bool    active;
    }
    mapping(uint256 => SecondaryListing) public secondaryListings;

    // ─── Events ─────────────────────────────────────────────────────────────
    event ContractMinted(uint256 indexed tokenId, address indexed farmer, string metadataURI, uint256 priceUsdc);
    event ContractPurchased(uint256 indexed tokenId, address indexed buyer, uint256 priceUsdc);
    event ContractRedeemed(uint256 indexed tokenId, address indexed buyer);
    event ListingCancelled(uint256 indexed tokenId);

    event SecondaryListed(uint256 indexed tokenId, address indexed seller, uint256 priceUsdc);
    event SecondaryPurchased(uint256 indexed tokenId, address indexed buyer, uint256 priceUsdc, address farmer, uint256 farmerRoyalty, uint256 platformFee);
    event SecondaryListingCancelled(uint256 indexed tokenId);

    event PlatformFeeUpdated(uint256 newFeeBps);
    event FarmerSecondaryRoyaltyUpdated(uint256 newBps);
    event FeeRecipientUpdated(address newRecipient);

    // ─── Constructor ────────────────────────────────────────────────────────
    constructor(address _nftContract, address _usdc, address _feeRecipient)
        Ownable(msg.sender)
    {
        require(_nftContract  != address(0), "PrecropMarket: zero NFT address");
        require(_usdc         != address(0), "PrecropMarket: zero USDC address");
        require(_feeRecipient != address(0), "PrecropMarket: zero fee recipient");
        nftContract  = PrecropNFT(_nftContract);
        usdc         = IERC20(_usdc);
        feeRecipient = _feeRecipient;
    }

    // ─── Primary: Farmer actions ─────────────────────────────────────────────

    /**
     * @notice Farmer mints a micro-futures NFT and lists it for primary sale.
     *         NFT is held in escrow until sold or cancelled.
     */
    function mintAndList(
        string calldata metadataURI,
        uint256         priceUsdc
    ) external returns (uint256 tokenId) {
        require(priceUsdc > 0,                 "PrecropMarket: price must be > 0");
        require(bytes(metadataURI).length > 0, "PrecropMarket: empty URI");

        tokenId = nftContract.mint(address(this), msg.sender, metadataURI, FARMER_ERC2981_BPS);

        listings[tokenId] = Listing({
            farmer:    msg.sender,
            priceUsdc: priceUsdc,
            active:    true
        });

        emit ContractMinted(tokenId, msg.sender, metadataURI, priceUsdc);
    }

    /**
     * @notice Farmer cancels a primary listing; NFT returned to farmer.
     */
    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.farmer == msg.sender, "PrecropMarket: not farmer");
        require(listing.active,               "PrecropMarket: not active");

        listing.active = false;
        nftContract.transferFrom(address(this), msg.sender, tokenId);

        emit ListingCancelled(tokenId);
    }

    // ─── Primary: Buyer purchase ─────────────────────────────────────────────

    /**
     * @notice Buyer purchases a primary-listed NFT.
     *         Split: (100% - 2.5%) to farmer, 2.5% to platform.
     *         Buyer must approve this contract for `priceUsdc` USDC before calling.
     */
    function buy(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "PrecropMarket: listing not active");

        uint256 price          = listing.priceUsdc;
        address farmer         = listing.farmer;
        uint256 platformFee    = (price * platformFeeBps) / 10_000;
        uint256 farmerProceeds = price - platformFee;

        listing.active = false;

        require(usdc.transferFrom(msg.sender, address(this), price), "PrecropMarket: USDC pull failed");
        require(usdc.transfer(farmer, farmerProceeds),               "PrecropMarket: farmer transfer failed");
        if (platformFee > 0) {
            require(usdc.transfer(feeRecipient, platformFee),        "PrecropMarket: fee transfer failed");
        }

        nftContract.transferFrom(address(this), msg.sender, tokenId);

        emit ContractPurchased(tokenId, msg.sender, price);
    }

    // ─── Secondary: Buyer relists ────────────────────────────────────────────

    /**
     * @notice NFT owner relists their token for secondary sale.
     *         Caller must approve this contract for the NFT before calling.
     *         Cannot relist a token that has an active primary listing.
     */
    function relist(uint256 tokenId, uint256 priceUsdc) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "PrecropMarket: not owner");
        require(priceUsdc > 0,                              "PrecropMarket: price must be > 0");
        require(!listings[tokenId].active,                  "PrecropMarket: primary listing active");

        // Transfer NFT into escrow
        nftContract.transferFrom(msg.sender, address(this), tokenId);

        secondaryListings[tokenId] = SecondaryListing({
            seller:    msg.sender,
            priceUsdc: priceUsdc,
            active:    true
        });

        emit SecondaryListed(tokenId, msg.sender, priceUsdc);
    }

    /**
     * @notice Seller cancels a secondary listing; NFT returned to seller.
     */
    function cancelSecondaryListing(uint256 tokenId) external {
        SecondaryListing storage sl = secondaryListings[tokenId];
        require(sl.seller == msg.sender, "PrecropMarket: not seller");
        require(sl.active,               "PrecropMarket: not active");

        sl.active = false;
        nftContract.transferFrom(address(this), msg.sender, tokenId);

        emit SecondaryListingCancelled(tokenId);
    }

    // ─── Secondary: Buyer purchases resale ───────────────────────────────────

    /**
     * @notice Buyer purchases a secondary-listed NFT.
     *         Split: 2.5% to platform + 2.5% to original farmer + remainder to seller.
     *         Buyer must approve this contract for `priceUsdc` USDC before calling.
     */
    function buySecondary(uint256 tokenId) external nonReentrant {
        SecondaryListing storage sl = secondaryListings[tokenId];
        require(sl.active, "PrecropMarket: not listed for secondary sale");

        uint256 price          = sl.priceUsdc;
        address seller         = sl.seller;
        address farmer         = nftContract.creator(tokenId);  // original farmer

        uint256 platformFee    = (price * platformFeeBps)            / 10_000; // 2.5%
        uint256 farmerRoyalty  = (price * farmerSecondaryRoyaltyBps) / 10_000; // 2.5%
        uint256 sellerProceeds = price - platformFee - farmerRoyalty;          // 95%

        sl.active = false;

        require(usdc.transferFrom(msg.sender, address(this), price), "PrecropMarket: USDC pull failed");
        require(usdc.transfer(seller, sellerProceeds),               "PrecropMarket: seller transfer failed");
        if (farmerRoyalty > 0 && farmer != address(0)) {
            require(usdc.transfer(farmer, farmerRoyalty),            "PrecropMarket: farmer royalty failed");
        }
        if (platformFee > 0) {
            require(usdc.transfer(feeRecipient, platformFee),        "PrecropMarket: fee transfer failed");
        }

        nftContract.transferFrom(address(this), msg.sender, tokenId);

        emit SecondaryPurchased(tokenId, msg.sender, price, farmer, farmerRoyalty, platformFee);
    }

    // ─── Buyer: Redeem ───────────────────────────────────────────────────────

    /**
     * @notice Buyer redeems (burns) the NFT to confirm delivery.
     *         Only the current NFT owner can call this.
     */
    function redeem(uint256 tokenId) external nonReentrant {
        require(nftContract.ownerOf(tokenId) == msg.sender, "PrecropMarket: not NFT owner");
        nftContract.redeem(tokenId);
        emit ContractRedeemed(tokenId, msg.sender);
    }

    // ─── ERC-721 Receiver ───────────────────────────────────────────────────

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // ─── View helpers ────────────────────────────────────────────────────────

    function getListing(uint256 tokenId)
        external view
        returns (address farmer, uint256 priceUsdc, bool active)
    {
        Listing storage l = listings[tokenId];
        return (l.farmer, l.priceUsdc, l.active);
    }

    function getSecondaryListing(uint256 tokenId)
        external view
        returns (address seller, uint256 priceUsdc, bool active)
    {
        SecondaryListing storage sl = secondaryListings[tokenId];
        return (sl.seller, sl.priceUsdc, sl.active);
    }

    // ─── Admin ──────────────────────────────────────────────────────────────

    /**
     * @notice Update primary + secondary platform fee (max 10%).
     */
    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1_000, "PrecropMarket: fee too high");
        platformFeeBps = _feeBps;
        emit PlatformFeeUpdated(_feeBps);
    }

    /**
     * @notice Update farmer secondary royalty (max 10%).
     */
    function setFarmerSecondaryRoyalty(uint256 _bps) external onlyOwner {
        require(_bps <= 1_000, "PrecropMarket: royalty too high");
        farmerSecondaryRoyaltyBps = _bps;
        emit FarmerSecondaryRoyaltyUpdated(_bps);
    }

    /**
     * @notice Update fee recipient address.
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "PrecropMarket: zero address");
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }
}
