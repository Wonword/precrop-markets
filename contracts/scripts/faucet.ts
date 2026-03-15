/**
 * faucet.ts
 *
 * Mint MockUSDC to one or more addresses on an already-deployed MockUSDC.
 *
 * Usage:
 *   MOCK_USDC_ADDRESS=0x... FAUCET_RECIPIENTS=0xAlice,0xBob \
 *     npx hardhat run scripts/faucet.ts --network base-sepolia
 *
 * Env vars:
 *   MOCK_USDC_ADDRESS  – deployed MockUSDC address (required)
 *   FAUCET_RECIPIENTS  – comma-separated recipient addresses (required)
 *   FAUCET_AMOUNT_USDC – USDC per recipient, default 10000
 */

import { ethers } from "hardhat";

async function main() {
  const usdcAddress = process.env.MOCK_USDC_ADDRESS;
  if (!usdcAddress) throw new Error("MOCK_USDC_ADDRESS is not set");

  const recipientsRaw = process.env.FAUCET_RECIPIENTS;
  if (!recipientsRaw) throw new Error("FAUCET_RECIPIENTS is not set (comma-separated addresses)");

  const recipients = recipientsRaw.split(",").map((a) => a.trim()).filter(Boolean);
  const amountUsdc = process.env.FAUCET_AMOUNT_USDC
    ? parseInt(process.env.FAUCET_AMOUNT_USDC)
    : 10_000;
  const atoms = BigInt(amountUsdc) * 1_000_000n;

  const [deployer] = await ethers.getSigners();
  console.log("Minting from:", deployer.address);

  const usdc = await ethers.getContractAt("MockUSDC", usdcAddress);

  for (const recipient of recipients) {
    const tx = await usdc.mint(recipient, atoms);
    await tx.wait();
    console.log(`✓ Minted ${amountUsdc.toLocaleString()} USDC → ${recipient}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
