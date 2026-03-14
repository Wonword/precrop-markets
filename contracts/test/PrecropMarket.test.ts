import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { PrecropNFT, PrecropMarket, MockUSDC } from "../typechain-types";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** USDC uses 6 decimals: 1 USDC = 1_000_000 */
function usdc(amount: number): bigint {
  return BigInt(amount) * 1_000_000n;
}

const SAMPLE_URI = "ipfs://QmSampleMetadataHash";

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe("Precrop Contracts", function () {
  let nft: PrecropNFT;
  let market: PrecropMarket;
  let mockUsdc: MockUSDC;

  let owner: HardhatEthersSigner;    // deployer / platform
  let farmer: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, farmer, buyer, other] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUsdc = await MockUSDCFactory.deploy();

    // Deploy PrecropNFT
    const NFTFactory = await ethers.getContractFactory("PrecropNFT");
    nft = await NFTFactory.deploy();

    // Deploy PrecropMarket
    const MarketFactory = await ethers.getContractFactory("PrecropMarket");
    market = await MarketFactory.deploy(
      await nft.getAddress(),
      await mockUsdc.getAddress(),
      owner.address   // fee recipient = deployer
    );

    // Authorize market on NFT contract
    await nft.setMarketContract(await market.getAddress());

    // Give buyer 10,000 USDC
    await mockUsdc.mint(buyer.address, usdc(10_000));
  });

  // ─── PrecropNFT ───────────────────────────────────────────────────────────

  describe("PrecropNFT", function () {
    it("sets name and symbol correctly", async function () {
      expect(await nft.name()).to.equal("Precrop Micro-Futures");
      expect(await nft.symbol()).to.equal("PRECROP");
    });

    it("only authorized market can mint", async function () {
      await expect(
        nft.connect(farmer).mint(farmer.address, farmer.address, SAMPLE_URI, 500)
      ).to.be.revertedWith("PrecropNFT: caller is not market");
    });

    it("only authorized market can redeem", async function () {
      // Mint via market first
      await market.connect(farmer).mintAndList(SAMPLE_URI, usdc(100));
      // Buyer buys
      await mockUsdc.connect(buyer).approve(await market.getAddress(), usdc(100));
      await market.connect(buyer).buy(0);
      // Try to redeem directly on NFT (not via market)
      await expect(
        nft.connect(buyer).redeem(0)
      ).to.be.revertedWith("PrecropNFT: caller is not market");
    });

    it("only owner can set market contract", async function () {
      await expect(
        nft.connect(farmer).setMarketContract(farmer.address)
      ).to.be.reverted;
    });

    it("supportsInterface: ERC-721 and ERC-2981", async function () {
      const ERC721_ID  = "0x80ac58cd";
      const ERC2981_ID = "0x2a55205a";
      expect(await nft.supportsInterface(ERC721_ID)).to.be.true;
      expect(await nft.supportsInterface(ERC2981_ID)).to.be.true;
    });
  });

  // ─── mintAndList ──────────────────────────────────────────────────────────

  describe("mintAndList", function () {
    it("mints token to market contract (escrow) with correct metadata", async function () {
      await expect(market.connect(farmer).mintAndList(SAMPLE_URI, usdc(500)))
        .to.emit(market, "ContractMinted")
        .withArgs(0, farmer.address, SAMPLE_URI, usdc(500));

      // NFT is held in escrow by market
      expect(await nft.ownerOf(0)).to.equal(await market.getAddress());
      expect(await nft.tokenURI(0)).to.equal(SAMPLE_URI);
    });

    it("creates listing with correct data", async function () {
      await market.connect(farmer).mintAndList(SAMPLE_URI, usdc(500));
      const [listedFarmer, listedPrice, active] = await market.getListing(0);
      expect(listedFarmer).to.equal(farmer.address);
      expect(listedPrice).to.equal(usdc(500));
      expect(active).to.be.true;
    });

    it("increments token IDs sequentially starting at 0", async function () {
      await market.connect(farmer).mintAndList(SAMPLE_URI, usdc(100));
      await market.connect(farmer).mintAndList(SAMPLE_URI, usdc(200));
      expect(await nft.ownerOf(0)).to.equal(await market.getAddress());
      expect(await nft.ownerOf(1)).to.equal(await market.getAddress());
    });

    it("reverts on zero price", async function () {
      await expect(
        market.connect(farmer).mintAndList(SAMPLE_URI, 0)
      ).to.be.revertedWith("PrecropMarket: price must be > 0");
    });

    it("reverts on empty metadata URI", async function () {
      await expect(
        market.connect(farmer).mintAndList("", usdc(100))
      ).to.be.revertedWith("PrecropMarket: empty URI");
    });

    it("sets ERC-2981 royalty: farmer at 5%", async function () {
      await market.connect(farmer).mintAndList(SAMPLE_URI, usdc(1000));
      const [receiver, royaltyAmt] = await nft.royaltyInfo(0, usdc(1000));
      expect(receiver).to.equal(farmer.address);
      expect(royaltyAmt).to.equal(usdc(50)); // 5% of 1,000 USDC
    });
  });

  // ─── buy ─────────────────────────────────────────────────────────────────

  describe("buy", function () {
    const PRICE = usdc(500);

    beforeEach(async function () {
      await market.connect(farmer).mintAndList(SAMPLE_URI, PRICE);
      await mockUsdc.connect(buyer).approve(await market.getAddress(), PRICE);
    });

    it("transfers NFT from escrow to buyer", async function () {
      await market.connect(buyer).buy(0);
      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("distributes USDC correctly: farmer gets 97.5%, platform 2.5%", async function () {
      const farmerBefore = await mockUsdc.balanceOf(farmer.address);
      const ownerBefore  = await mockUsdc.balanceOf(owner.address);

      await market.connect(buyer).buy(0);

      const farmerAfter = await mockUsdc.balanceOf(farmer.address);
      const ownerAfter  = await mockUsdc.balanceOf(owner.address);

      // 97.5% of 500 USDC = 487.5 USDC = 487_500_000 atomic units
      expect(farmerAfter - farmerBefore).to.equal(487_500_000n);
      // 2.5% of 500 USDC = 12.5 USDC = 12_500_000 atomic units
      expect(ownerAfter  - ownerBefore).to.equal(12_500_000n);
    });

    it("deducts full price from buyer's USDC balance", async function () {
      const buyerBefore = await mockUsdc.balanceOf(buyer.address);
      await market.connect(buyer).buy(0);
      const buyerAfter  = await mockUsdc.balanceOf(buyer.address);
      expect(buyerBefore - buyerAfter).to.equal(PRICE);
    });

    it("emits ContractPurchased event", async function () {
      await expect(market.connect(buyer).buy(0))
        .to.emit(market, "ContractPurchased")
        .withArgs(0, buyer.address, PRICE);
    });

    it("marks listing as inactive after purchase", async function () {
      await market.connect(buyer).buy(0);
      const [, , active] = await market.getListing(0);
      expect(active).to.be.false;
    });

    it("reverts when listing is not active (already sold)", async function () {
      await market.connect(buyer).buy(0);
      await mockUsdc.mint(other.address, PRICE);
      await mockUsdc.connect(other).approve(await market.getAddress(), PRICE);
      await expect(market.connect(other).buy(0))
        .to.be.revertedWith("PrecropMarket: listing not active");
    });

    it("reverts when buyer has insufficient USDC allowance", async function () {
      // Reset approval
      await mockUsdc.connect(buyer).approve(await market.getAddress(), 0);
      await expect(market.connect(buyer).buy(0)).to.be.reverted;
    });

    it("platform fee = 0 when fee set to 0%", async function () {
      await market.connect(owner).setPlatformFee(0);
      const farmerBefore = await mockUsdc.balanceOf(farmer.address);
      await market.connect(buyer).buy(0);
      const farmerAfter  = await mockUsdc.balanceOf(farmer.address);
      expect(farmerAfter - farmerBefore).to.equal(PRICE); // 100% to farmer
    });
  });

  // ─── redeem ───────────────────────────────────────────────────────────────

  describe("redeem", function () {
    beforeEach(async function () {
      await market.connect(farmer).mintAndList(SAMPLE_URI, usdc(500));
      await mockUsdc.connect(buyer).approve(await market.getAddress(), usdc(500));
      await market.connect(buyer).buy(0);
    });

    it("burns the NFT on redemption", async function () {
      await market.connect(buyer).redeem(0);
      await expect(nft.ownerOf(0)).to.be.reverted; // token no longer exists
    });

    it("emits ContractRedeemed event", async function () {
      await expect(market.connect(buyer).redeem(0))
        .to.emit(market, "ContractRedeemed")
        .withArgs(0, buyer.address);
    });

    it("reverts if caller is not NFT owner", async function () {
      await expect(
        market.connect(other).redeem(0)
      ).to.be.revertedWith("PrecropMarket: not NFT owner");
    });

    it("reverts if farmer tries to redeem a sold contract", async function () {
      await expect(
        market.connect(farmer).redeem(0)
      ).to.be.revertedWith("PrecropMarket: not NFT owner");
    });
  });

  // ─── cancelListing ────────────────────────────────────────────────────────

  describe("cancelListing", function () {
    beforeEach(async function () {
      await market.connect(farmer).mintAndList(SAMPLE_URI, usdc(500));
    });

    it("returns NFT to farmer on cancel", async function () {
      await market.connect(farmer).cancelListing(0);
      expect(await nft.ownerOf(0)).to.equal(farmer.address);
    });

    it("marks listing as inactive", async function () {
      await market.connect(farmer).cancelListing(0);
      const [, , active] = await market.getListing(0);
      expect(active).to.be.false;
    });

    it("emits ListingCancelled event", async function () {
      await expect(market.connect(farmer).cancelListing(0))
        .to.emit(market, "ListingCancelled")
        .withArgs(0);
    });

    it("reverts if not the listing farmer", async function () {
      await expect(
        market.connect(other).cancelListing(0)
      ).to.be.revertedWith("PrecropMarket: not farmer");
    });

    it("reverts if listing is already inactive (sold)", async function () {
      await mockUsdc.connect(buyer).approve(await market.getAddress(), usdc(500));
      await market.connect(buyer).buy(0);
      await expect(
        market.connect(farmer).cancelListing(0)
      ).to.be.revertedWith("PrecropMarket: not active");
    });
  });

  // ─── Admin ────────────────────────────────────────────────────────────────

  describe("Admin: setPlatformFee", function () {
    it("owner can update platform fee", async function () {
      await expect(market.connect(owner).setPlatformFee(500))
        .to.emit(market, "PlatformFeeUpdated")
        .withArgs(500);
      expect(await market.platformFeeBps()).to.equal(500);
    });

    it("reverts if fee > 10%", async function () {
      await expect(
        market.connect(owner).setPlatformFee(1_001)
      ).to.be.revertedWith("PrecropMarket: fee too high");
    });

    it("reverts if non-owner tries to set fee", async function () {
      await expect(
        market.connect(farmer).setPlatformFee(100)
      ).to.be.reverted;
    });
  });

  describe("Admin: setFeeRecipient", function () {
    it("owner can update fee recipient", async function () {
      await expect(market.connect(owner).setFeeRecipient(other.address))
        .to.emit(market, "FeeRecipientUpdated")
        .withArgs(other.address);
      expect(await market.feeRecipient()).to.equal(other.address);
    });

    it("reverts on zero address", async function () {
      await expect(
        market.connect(owner).setFeeRecipient(ethers.ZeroAddress)
      ).to.be.revertedWith("PrecropMarket: zero address");
    });

    it("reverts if non-owner tries to update", async function () {
      await expect(
        market.connect(buyer).setFeeRecipient(buyer.address)
      ).to.be.reverted;
    });
  });

  // ─── Constructor validation ───────────────────────────────────────────────

  describe("Constructor validation", function () {
    it("reverts on zero NFT address", async function () {
      const MarketFactory = await ethers.getContractFactory("PrecropMarket");
      await expect(
        MarketFactory.deploy(
          ethers.ZeroAddress,
          await mockUsdc.getAddress(),
          owner.address
        )
      ).to.be.revertedWith("PrecropMarket: zero NFT address");
    });

    it("reverts on zero USDC address", async function () {
      const MarketFactory = await ethers.getContractFactory("PrecropMarket");
      await expect(
        MarketFactory.deploy(
          await nft.getAddress(),
          ethers.ZeroAddress,
          owner.address
        )
      ).to.be.revertedWith("PrecropMarket: zero USDC address");
    });

    it("reverts on zero fee recipient", async function () {
      const MarketFactory = await ethers.getContractFactory("PrecropMarket");
      await expect(
        MarketFactory.deploy(
          await nft.getAddress(),
          await mockUsdc.getAddress(),
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("PrecropMarket: zero fee recipient");
    });
  });

  // ─── End-to-end lifecycle ─────────────────────────────────────────────────

  describe("Full lifecycle: mint → buy → redeem", function () {
    it("completes a full crop contract lifecycle", async function () {
      const PRICE = usdc(1_240); // Emmer Farro example

      // 1. Farmer lists a contract
      await market.connect(farmer).mintAndList(SAMPLE_URI, PRICE);
      expect(await nft.ownerOf(0)).to.equal(await market.getAddress()); // in escrow

      // 2. Buyer approves and purchases
      await mockUsdc.connect(buyer).approve(await market.getAddress(), PRICE);
      await market.connect(buyer).buy(0);
      expect(await nft.ownerOf(0)).to.equal(buyer.address);

      // 3. After harvest, buyer redeems
      await market.connect(buyer).redeem(0);
      await expect(nft.ownerOf(0)).to.be.reverted; // burned

      // Verify final USDC balances
      const farmerBalance = await mockUsdc.balanceOf(farmer.address);
      const feeBalance    = await mockUsdc.balanceOf(owner.address);
      expect(farmerBalance).to.equal(usdc(1_209)); // 97.5% of 1,240
      expect(feeBalance).to.equal(usdc(31));        // 2.5% of 1,240
    });
  });
});
