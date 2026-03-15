import { ethers } from "hardhat";

// USDC on Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
// USDC on Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY is not set in .env.local");
  }

  const [deployer] = await ethers.getSigners();
  const FEE_RECIPIENT = process.env.FEE_RECIPIENT || deployer.address;
  console.log("Deploying with:", deployer.address);

  // 1. Deploy PrecropNFT
  const PrecropNFT = await ethers.getContractFactory("PrecropNFT");
  const nft = await PrecropNFT.deploy();
  await nft.waitForDeployment();
  console.log("PrecropNFT deployed to:", await nft.getAddress());

  // 2. Deploy PrecropMarket
  const PrecropMarket = await ethers.getContractFactory("PrecropMarket");
  const market = await PrecropMarket.deploy(
    await nft.getAddress(),
    USDC_ADDRESS,
    FEE_RECIPIENT
  );
  await market.waitForDeployment();
  console.log("PrecropMarket deployed to:", await market.getAddress());

  // 3. Authorize market contract on NFT
  await nft.setMarketContract(await market.getAddress());
  console.log("Market authorized on NFT contract");

  console.log("\n── Add these to your .env.local ──────────────────────");
  console.log(`NEXT_PUBLIC_PRECROP_NFT_ADDRESS=${await nft.getAddress()}`);
  console.log(`NEXT_PUBLIC_PRECROP_MARKET_ADDRESS=${await market.getAddress()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
