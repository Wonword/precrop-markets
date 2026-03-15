/**
 * cancel-pending.ts
 *
 * Cancels all stuck pending transactions by sending 0-value self-transfers
 * at each pending nonce with 2× the current gas price.
 *
 * Usage:
 *   npx hardhat run scripts/cancel-pending.ts --network base-sepolia
 */

import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const provider = ethers.provider;

  const confirmedNonce = await provider.getTransactionCount(signer.address, "latest");
  const pendingNonce   = await provider.getTransactionCount(signer.address, "pending");

  console.log(`Address:          ${signer.address}`);
  console.log(`Confirmed nonce:  ${confirmedNonce}`);
  console.log(`Pending nonce:    ${pendingNonce}`);

  if (confirmedNonce === pendingNonce) {
    console.log("No stuck transactions — mempool is clear ✓");
    return;
  }

  // Get current fee data and double it to guarantee replacement
  const feeData = await provider.getFeeData();
  const maxFeePerGas         = (feeData.maxFeePerGas         ?? 1_000_000_000n) * 3n;
  const maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas ?? 1_000_000_000n) * 3n;

  console.log(`\nCancelling nonces ${confirmedNonce} → ${pendingNonce - 1} with 3× gas price…`);

  for (let nonce = confirmedNonce; nonce < pendingNonce; nonce++) {
    const tx = await signer.sendTransaction({
      to: signer.address,
      value: 0n,
      nonce,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    console.log(`  Nonce ${nonce}: cancel tx ${tx.hash}`);
    await tx.wait();
    console.log(`  Nonce ${nonce}: confirmed ✓`);
  }

  console.log("\nAll stuck transactions cancelled. Mempool is clear ✓");
  console.log("Now run setup-testnet again.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
