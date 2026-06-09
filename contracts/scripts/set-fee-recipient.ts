/**
 * set-fee-recipient.ts
 * Points the live PrecropMarket at the official Precrop Markets wallet so the
 * 2.5% platform fee on every sale is routed there. Owner-only.
 *
 * Usage:
 *   npx hardhat run scripts/set-fee-recipient.ts --network base-sepolia
 *
 * Requires in .env.local (one level up):
 *   DEPLOYER_PRIVATE_KEY (must be the contract owner), NEXT_PUBLIC_PRECROP_MARKET_ADDRESS
 */

import { ethers } from "hardhat";

const MARKET_ADDRESS = process.env.NEXT_PUBLIC_PRECROP_MARKET_ADDRESS!;
const PRECROP_FEE_WALLET = "0x8E40C98EcbF2C928E9177D4DC1d989C2c5BfDad2";

async function main() {
  if (!MARKET_ADDRESS) throw new Error("NEXT_PUBLIC_PRECROP_MARKET_ADDRESS not set in .env.local");

  const [signer] = await ethers.getSigners();
  const market = await ethers.getContractAt("PrecropMarket", MARKET_ADDRESS, signer);

  const owner = await market.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(
      `Signer ${signer.address} is not the contract owner (${owner}). ` +
        `setFeeRecipient is owner-only.`
    );
  }

  const before = await market.feeRecipient();
  if (before.toLowerCase() === PRECROP_FEE_WALLET.toLowerCase()) {
    console.log("Fee recipient is already the Precrop wallet — nothing to do.");
    return;
  }

  console.log("Owner:        ", signer.address);
  console.log("Fee recipient:", before, "→", PRECROP_FEE_WALLET);

  const tx = await market.setFeeRecipient(PRECROP_FEE_WALLET);
  console.log("Sent tx:", tx.hash, "— waiting for confirmation...");
  await tx.wait();

  const after = await market.feeRecipient();
  console.log("✅ Confirmed. Fee recipient is now:", after);
  console.log("   BaseScan: https://sepolia.basescan.org/tx/" + tx.hash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
