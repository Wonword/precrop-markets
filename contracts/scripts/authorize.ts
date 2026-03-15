import { ethers } from "hardhat";

const NFT_ADDRESS = "0x2336f1F3fEe44Cad50fBAb24360f171B3114D3C4";
const MARKET_ADDRESS = "0x69162Bd45E5416Caec225542D2CfA1403D0c6eDc";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Authorizing with:", deployer.address);

  const nft = await ethers.getContractAt("PrecropNFT", NFT_ADDRESS);
  const tx = await nft.setMarketContract(MARKET_ADDRESS);
  await tx.wait();
  console.log("✅ Market authorized on NFT contract. Tx:", tx.hash);

  console.log("\n── Add these to your .env.local ──────────────────────");
  console.log(`NEXT_PUBLIC_PRECROP_NFT_ADDRESS=${NFT_ADDRESS}`);
  console.log(`NEXT_PUBLIC_PRECROP_MARKET_ADDRESS=${MARKET_ADDRESS}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
