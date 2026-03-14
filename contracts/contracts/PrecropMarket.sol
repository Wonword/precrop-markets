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
 *  Flow:
 *    1. Farmer calls mintAndList()  → NFT is minted into this contract (escrow).
 *    2. Buyer calls buy()           → USDC split to farmer + platform; NFT sent to buyer.
 *    3. Buyer calls redeem()        → NFT is burned; contract closed.
 *    4. Farmer calls cancelListing()→ NFT returned to farmer; listing removed.
 *
 *  Holding the NFT in escrow avoids requiring a separate farmer approval tx.
 *  Platform fee default: 2.5% (250 bps).  Farmer royalty on 2nd sales: 5% (500 bps).
 */
contract PrecropMarket is ReentrancyGuard, Ownable, IERC721Receiver {
    PrecropNFT public immutable nftContract;
    IERC20    public immutable usdc;

    uint96  public constant FARMER_ROYALTY_BPS = 500;   // 5 % on secondary sales
    uint256 public platformFeeBps              = 250;   // 2.5 % platform fee
    address public feeRecipient;

    struct Listing {
        address farmer;
        uint256 priceUsdc;  // full price in USDC (6 decimals)
        bool    active;
    }

    mapping(uint256 => Listing) public listings;

    // ─── Events ─────────────────────────────────────────────────────────────
    event ContractMinted(
        uint256 indexed tokenId,
        address indexed farmer,
        string  metadataURI,
        uint256 priceUsdc
    );
    event ContractPurchased(
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 priceUsdc
    );
    event ContractRedeemed(uint256 indexed tokenId, address indexed buyer);
    event ListingCancelled(uint256 indexed tokenId);
    event PlatformFeeUpdated(uint256 newFeeBps);
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

    // ─── Farmer actions ─────────────────────────────────────────────────────

    /**
     * @notice Farmer mints a micro-futures NFT and lists it for sale.
     *         The NFT is held in escrow by this contract until sold or cancelled.
     * @param metadataURI  IPFS URI pointing to the contract JSON metadata.
     * @param priceUsdc    Sale price in USDC atomic units (6 decimals).
     * @return tokenId     The newly minted token ID.
     */
    function mintAndList(
        string calldata metadataURI,
        uint256         priceUsdc
    ) external returns (uint256 tokenId) {
        require(priceUsdc > 0, "PrecropMarket: price must be > 0");
        require(bytes(metadataURI).length > 0, "PrecropMarket: empty URI");

        // Mint to this contract (escrow) so no separate approval is needed on purchase.
        // Farmer is recorded as royalty receiver for secondary-sale royalties.
        tokenId = nftContract.mint(address(this), msg.sender, metadataURI, FARMER_ROYALTY_BPS);

        listings[tokenId] = Listing({
            farmer:    msg.sender,
            priceUsdc: priceUsdc,
            active:    true
        });

        // Record farmer as royalty receiver even though escrow holds the token
        emit ContractMinted(tokenId, msg.sender, metadataURI, priceUsdc);
    }

    /**
     * @notice Farmer cancels an active listing; NFT is returned to the farmer.
     */
    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.farmer == msg.sender, "PrecropMarket: not farmer");
        require(listing.active,                "PrecropMarket: not active");

        listing.active = false;
        // Return NFT from escrow to farmer
        nftContract.transferFrom(address(this), msg.sender, tokenId);

        emit ListingCancelled(tokenId);
    }

    // ─── Buyer actions ──────────────────────────────────────────────────────

    /**
     * @notice Buyer purchases a listed NFT.
     *         Buyer must have approved this contract for `priceUsdc` USDC.
     *         Farmer receives (priceUsdc - platformFee); platform fee goes to feeRecipient.
     */
    function buy(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "PrecropMarket: listing not active");

        uint256 price          = listing.priceUsdc;
        address farmer         = listing.farmer;

        uint256 platformFee    = (price * platformFeeBps) / 10_000;
        uint256 farmerProceeds = price - platformFee;

        // Mark inactive before transfers (re-entrancy guard + hygiene)
        listing.active = false;

        // Pull full USDC from buyer into this contract first, then distribute
        require(
            usdc.transferFrom(msg.sender, address(this), price),
            "PrecropMarket: USDC pull failed"
        );
        require(
            usdc.transfer(farmer, farmerProceeds),
            "PrecropMarket: farmer transfer failed"
        );
        if (platformFee > 0) {
            require(
                usdc.transfer(feeRecipient, platformFee),
                "PrecropMarket: fee transfer failed"
            );
        }

        // Transfer NFT from escrow to buyer
        nftContract.transferFrom(address(this), msg.sender, tokenId);

        emit ContractPurchased(tokenId, msg.sender, price);
    }

    /**
     * @notice Buyer redeems (burns) the NFT to confirm delivery and close the contract.
     *         Only the current NFT owner can call this.
     */
    function redeem(uint256 tokenId) external nonReentrant {
        require(
            nftContract.ownerOf(tokenId) == msg.sender,
            "PrecropMarket: not NFT owner"
        );
        nftContract.redeem(tokenId);
        emit ContractRedeemed(tokenId, msg.sender);
    }

    // ─── ERC-721 Receiver ───────────────────────────────────────────────────

    /**
     * @notice Accept ERC-721 tokens sent to this contract (NFT escrow).
     *         Only tokens from the PrecropNFT contract are expected.
     */
    function onERC721Received(
        address,   // operator
        address,   // from
        uint256,   // tokenId
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // ─── Admin ──────────────────────────────────────────────────────────────

    /**
     * @notice Update platform fee (max 10%).
     */
    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1_000, "PrecropMarket: fee too high"); // max 10%
        platformFeeBps = _feeBps;
        emit PlatformFeeUpdated(_feeBps);
    }

    /**
     * @notice Update fee recipient address.
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "PrecropMarket: zero address");
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }

    /**
     * @notice Returns listing details for a given token ID.
     */
    function getListing(uint256 tokenId)
        external
        view
        returns (address farmer, uint256 priceUsdc, bool active)
    {
        Listing storage l = listings[tokenId];
        return (l.farmer, l.priceUsdc, l.active);
    }
}
