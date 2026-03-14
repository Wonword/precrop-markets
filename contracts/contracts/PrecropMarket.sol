// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PrecropNFT.sol";

/**
 * @title PrecropMarket
 * @notice Marketplace for Precrop micro-futures NFTs.
 *         Farmers mint, list, and receive USDC.
 *         Buyers purchase NFTs with USDC.
 *         At delivery, buyers redeem (burn) the NFT to close the contract.
 *         Platform takes a configurable fee (default 2.5% = 250 bps).
 */
contract PrecropMarket is ReentrancyGuard, Ownable {
    PrecropNFT public immutable nftContract;
    IERC20 public immutable usdc;

    uint96 public constant FARMER_ROYALTY_BPS = 500;  // 5%
    uint256 public platformFeeBps = 250;               // 2.5%
    address public feeRecipient;

    struct Listing {
        address farmer;
        uint256 priceUsdc;
        bool active;
    }

    mapping(uint256 => Listing) public listings;

    event ContractMinted(uint256 indexed tokenId, address indexed farmer, string metadataURI, uint256 priceUsdc);
    event ContractPurchased(uint256 indexed tokenId, address indexed buyer, uint256 priceUsdc);
    event ContractRedeemed(uint256 indexed tokenId, address indexed buyer);
    event ListingCancelled(uint256 indexed tokenId);
    event PlatformFeeUpdated(uint256 newFeeBps);

    constructor(address _nftContract, address _usdc, address _feeRecipient)
        Ownable(msg.sender)
    {
        nftContract = PrecropNFT(_nftContract);
        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
    }

    /**
     * @notice Farmer mints a new micro-futures NFT and lists it for sale.
     * @param metadataURI  IPFS URI for the contract metadata (image + PDF + details).
     * @param priceUsdc    Sale price in USDC (6 decimals).
     */
    function mintAndList(
        string calldata metadataURI,
        uint256 priceUsdc
    ) external returns (uint256 tokenId) {
        require(priceUsdc > 0, "PrecropMarket: price must be > 0");

        tokenId = nftContract.mint(msg.sender, metadataURI, FARMER_ROYALTY_BPS);
        listings[tokenId] = Listing({
            farmer: msg.sender,
            priceUsdc: priceUsdc,
            active: true
        });

        emit ContractMinted(tokenId, msg.sender, metadataURI, priceUsdc);
    }

    /**
     * @notice Buyer purchases a listed micro-futures NFT with USDC.
     *         Platform fee is deducted; farmer receives the remainder.
     */
    function buy(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "PrecropMarket: listing not active");

        uint256 price = listing.priceUsdc;
        address farmer = listing.farmer;

        uint256 platformFee = (price * platformFeeBps) / 10_000;
        uint256 farmerProceeds = price - platformFee;

        listing.active = false;

        // Transfer USDC from buyer
        require(usdc.transferFrom(msg.sender, farmer, farmerProceeds), "PrecropMarket: farmer transfer failed");
        if (platformFee > 0) {
            require(usdc.transferFrom(msg.sender, feeRecipient, platformFee), "PrecropMarket: fee transfer failed");
        }

        // Transfer NFT from farmer to buyer
        nftContract.transferFrom(farmer, msg.sender, tokenId);

        emit ContractPurchased(tokenId, msg.sender, price);
    }

    /**
     * @notice Buyer redeems (burns) the NFT upon delivery to close the contract.
     */
    function redeem(uint256 tokenId) external nonReentrant {
        require(nftContract.ownerOf(tokenId) == msg.sender, "PrecropMarket: not NFT owner");
        nftContract.redeem(tokenId);
        emit ContractRedeemed(tokenId, msg.sender);
    }

    /**
     * @notice Farmer cancels an active listing (only if not yet sold).
     */
    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.farmer == msg.sender, "PrecropMarket: not farmer");
        require(listing.active, "PrecropMarket: not active");
        listing.active = false;
        emit ListingCancelled(tokenId);
    }

    // ─── Admin ──────────────────────────────────────────────────────────────

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "PrecropMarket: fee too high"); // max 10%
        platformFeeBps = _feeBps;
        emit PlatformFeeUpdated(_feeBps);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
}
