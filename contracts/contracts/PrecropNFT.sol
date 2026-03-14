// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PrecropNFT
 * @notice ERC-721 NFT representing a micro-futures contract for agricultural goods.
 *         Each token is a unique contract between a farmer and a buyer.
 *         Includes ERC-2981 royalty standard so the farmer earns 5% on secondary sales.
 */
contract PrecropNFT is ERC721URIStorage, ERC2981, Ownable {
    uint256 private _nextTokenId;

    // Authorized minter (the PrecropMarket contract)
    address public marketContract;

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
     * @param to              Address that will hold the NFT (market escrow = address(market)).
     * @param royaltyReceiver Farmer's wallet — receives ERC-2981 royalties on secondary sales.
     * @param metadataURI     IPFS URI pointing to the contract JSON metadata.
     * @param royaltyFeeBps   Royalty fee in basis points (e.g. 500 = 5%).
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
