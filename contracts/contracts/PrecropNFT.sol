// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PrecropNFT
 * @notice ERC-721 NFT representing a micro-futures contract for agricultural goods.
 *
 *  Royalty structure:
 *    - Primary sale:   2.5% platform fee (enforced by PrecropMarket)
 *    - Secondary sale: 2.5% platform fee + 2.5% original farmer (enforced by PrecropMarket)
 *    - ERC-2981:       Reports 2.5% to original farmer for external marketplace compatibility.
 *
 *  The `creator` mapping stores the original farmer address for all secondary-sale royalty
 *  lookups by PrecropMarket.
 */
contract PrecropNFT is ERC721URIStorage, ERC2981, Ownable {
    uint256 private _nextTokenId;

    // Authorized minter (the PrecropMarket contract)
    address public marketContract;

    // Original creator (farmer) of each token — used for secondary royalty payments
    mapping(uint256 => address) public creator;

    event Minted(uint256 indexed tokenId, address indexed farmer, string metadataURI);
    event Redeemed(uint256 indexed tokenId, address indexed redeemer);

    modifier onlyMarket() {
        require(msg.sender == marketContract, "PrecropNFT: caller is not market");
        _;
    }

    constructor() ERC721("Precrop Micro-Futures", "PRECROP") Ownable(msg.sender) {}

    /**
     * @notice Set the authorized market contract address.
     */
    function setMarketContract(address _market) external onlyOwner {
        marketContract = _market;
    }

    /**
     * @notice Mint a new micro-futures NFT.
     * @param to              Address that will hold the NFT (market escrow).
     * @param royaltyReceiver Farmer's wallet — stored as creator and ERC-2981 royalty receiver.
     * @param metadataURI     IPFS URI pointing to the contract JSON metadata.
     * @param royaltyFeeBps   Royalty fee in basis points for ERC-2981 (250 = 2.5%).
     * @return tokenId        The newly minted token ID.
     */
    function mint(
        address to,
        address royaltyReceiver,
        string calldata metadataURI,
        uint96 royaltyFeeBps
    ) external onlyMarket returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFeeBps);
        creator[tokenId] = royaltyReceiver;
        emit Minted(tokenId, royaltyReceiver, metadataURI);
    }

    /**
     * @notice Burn (redeem) an NFT at contract delivery.
     *         Can only be called by the market contract.
     */
    function redeem(uint256 tokenId) external onlyMarket {
        address redeemer = ownerOf(tokenId);
        _burn(tokenId);
        emit Redeemed(tokenId, redeemer);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
