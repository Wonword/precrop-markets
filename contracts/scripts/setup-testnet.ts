/**
 * setup-testnet.ts
 *
 * One-shot testnet setup:
 *   1. Deploys MockUSDC
 *   2. Deploys PrecropNFT
 *   3. Deploys PrecropMarket (using MockUSDC)
 *   4. Authorises market on NFT
 *   5. Mints USDC to recipient wallets
 *
 * Usage:
 *   npx hardhat run scripts/setup-testnet.ts --network base-sepolia
 *
 * Optional env vars:
 *   FAUCET_RECIPIENTS  – comma-separated addresses to mint USDC to
 *                        (defaults to deployer wallet)
 *   FAUCET_AMOUNT_USDC – how many USDC to mint per recipient (default: 10000)
 *   FEE_RECIPIENT      – address to receive platform fees (default: deployer)
 */

import { ethers } from "hardhat";

const FAUCET_AMOUNT_USDC = process.env.FAUCET_AMOUNT_USDC
  ? parseInt(process.env.FAUCET_AMOUNT_USDC)
  : 10_000;

/** Always fetch a fresh pending nonce — avoids Hardhat's stale nonce cache */
async function nextNonce(address: string): Promise<number> {
  return ethers.provider.getTransactionCount(address, "pending");
}

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY is not set in .env.local");
  }

  const [deployer] = await ethers.getSigners();
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;

  const recipients: string[] = process.env.FAUCET_RECIPIENTS
    ? process.env.FAUCET_RECIPIENTS.split(",").map((a) => a.trim())
    : [deployer.address];

  console.log("Deployer:     ", deployer.address);
  console.log("Fee recipient:", feeRecipient);
  console.log("USDC per recipient:", FAUCET_AMOUNT_USDC.toLocaleString());
  console.log("Recipients:", recipients);
  console.log("");

  // ── 1. MockUSDC ────────────────────────────────────────────────────────────
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy({ nonce: await nextNonce(deployer.address) });
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:  ", usdcAddress);

  // ── 2. PrecropNFT ──────────────────────────────────────────────────────────
  const PrecropNFT = await ethers.getContractFactory("PrecropNFT");
  const nft = await PrecropNFT.deploy({ nonce: await nextNonce(deployer.address) });
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("PrecropNFT deployed to:", nftAddress);

  // ── 3. PrecropMarket ───────────────────────────────────────────────────────
  const PrecropMarket = await ethers.getContractFactory("PrecropMarket");
  const market = await PrecropMarket.deploy(
    nftAddress,
    usdcAddress,
    feeRecipient,
    { nonce: await nextNonce(deployer.address) }
  );
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("PrecropMarket deployed:", marketAddress);

  // ── 4. Authorise market on NFT ─────────────────────────────────────────────
  const authTx = await nft.setMarketContract(marketAddress, {
    nonce: await nextNonce(deployer.address),
  });
  await authTx.wait();
  console.log("Market authorised on NFT ✓");

  // ── 5. Mint USDC to recipients ─────────────────────────────────────────────
  const atoms = BigInt(FAUCET_AMOUNT_USDC) * 1_000_000n; // 6 decimals
  for (const recipient of recipients) {
    const tx = await usdc.mint(recipient, atoms, {
      nonce: await nextNonce(deployer.address),
    });
    await tx.wait();
    console.log(`Minted ${FAUCET_AMOUNT_USDC.toLocaleString()} USDC → ${recipient}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
── Update your .env.local ────────────────────────────────────────
NEXT_PUBLIC_PRECROP_NFT_ADDRESS=${nftAddress}
NEXT_PUBLIC_PRECROP_MARKET_ADDRESS=${marketAddress}
NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}
NEXT_PUBLIC_CHAIN_ID=84532
──────────────────────────────────────────────────────────────────

To mint more USDC later, run:
  npx hardhat run scripts/faucet.ts --network base-sepolia

  with MOCK_USDC_ADDRESS=${usdcAddress} and FAUCET_RECIPIENTS=0x...
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
