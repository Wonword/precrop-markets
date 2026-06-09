/**
 * verify-fees.ts
 * Read-only inspection of the live PrecropMarket fee configuration.
 *
 * Usage:
 *   npx hardhat run scripts/verify-fees.ts --network base-sepolia
 *
 * Requires in .env.local (one level up):
 *   NEXT_PUBLIC_PRECROP_MARKET_ADDRESS
 */

import { ethers } from "hardhat";

const MARKET_ADDRESS = process.env.NEXT_PUBLIC_PRECROP_MARKET_ADDRESS!;
const PRECROP_FEE_WALLET = "0x8E40C98EcbF2C928E9177D4DC1d989C2c5BfDad2";

async function main() {
  if (!MARKET_ADDRESS) throw new Error("NEXT_PUBLIC_PRECROP_MARKET_ADDRESS not set in .env.local");

  const [signer] = await ethers.getSigners();
  const market = await ethers.getContractAt("PrecropMarket", MARKET_ADDRESS, signer);

  const [owner, feeRecipient, platformFeeBps, farmerSecondaryBps] = await Promise.all([
    market.owner(),
    market.feeRecipient(),
    market.platformFeeBps(),
    market.farmerSecondaryRoyaltyBps(),
  ]);

  console.log("── Live PrecropMarket fee config ─────────────────────");
  console.log("Market address:        ", MARKET_ADDRESS);
  console.log("Contract owner:        ", owner);
  console.log("Current fee recipient: ", feeRecipient);
  console.log("Platform fee:          ", `${Number(platformFeeBps) / 100}% (${platformFeeBps} bps)`);
  console.log("Farmer secondary royalty:", `${Number(farmerSecondaryBps) / 100}% (${farmerSecondaryBps} bps)`);
  console.log("");
  console.log("Connected signer:      ", signer.address);
  console.log("Signer is owner:       ", owner.toLowerCase() === signer.address.toLowerCase());
  console.log("");
  console.log("Target Precrop wallet: ", PRECROP_FEE_WALLET);
  console.log(
    "Already set to Precrop?",
    feeRecipient.toLowerCase() === PRECROP_FEE_WALLET.toLowerCase()
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
