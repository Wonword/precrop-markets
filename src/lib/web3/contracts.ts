/**
 * Contract ABIs and addresses for Precrop Markets
 *
 * Set these env vars:
 *   NEXT_PUBLIC_PRECROP_NFT_ADDRESS    – deployed PrecropNFT address
 *   NEXT_PUBLIC_PRECROP_MARKET_ADDRESS – deployed PrecropMarket address
 *   NEXT_PUBLIC_USDC_ADDRESS           – USDC address on the target chain
 *   NEXT_PUBLIC_CHAIN_ID               – 8453 (Base) | 84532 (Base Sepolia)
 */

// ─── Addresses ────────────────────────────────────────────────────────────────

export const CONTRACT_ADDRESSES = {
  nft:    (process.env.NEXT_PUBLIC_PRECROP_NFT_ADDRESS    ?? "") as `0x${string}`,
  market: (process.env.NEXT_PUBLIC_PRECROP_MARKET_ADDRESS ?? "") as `0x${string}`,
  usdc:   (process.env.NEXT_PUBLIC_USDC_ADDRESS           ?? "") as `0x${string}`,
} as const;

/** True when contracts are configured and can be called */
export const contractsReady =
  CONTRACT_ADDRESSES.market.startsWith("0x") &&
  CONTRACT_ADDRESSES.usdc.startsWith("0x");

// ─── PrecropMarket ABI (minimal) ──────────────────────────────────────────────

export const MARKET_ABI = [
  // ── Read ──
  {
    name: "getListing",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "farmer",    type: "address" },
      { name: "priceUsdc", type: "uint256" },
      { name: "active",    type: "bool"    },
    ],
  },
  {
    name: "platformFeeBps",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // ── Write ──
  {
    name: "mintAndList",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "metadataURI", type: "string"  },
      { name: "priceUsdc",   type: "uint256" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    name: "buy",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "redeem",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelListing",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  // ── Secondary market ──
  {
    name: "getSecondaryListing",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "seller",    type: "address" },
      { name: "priceUsdc", type: "uint256" },
      { name: "active",    type: "bool"    },
    ],
  },
  {
    name: "farmerSecondaryRoyaltyBps",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "relist",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId",   type: "uint256" },
      { name: "priceUsdc", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "buySecondary",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelSecondaryListing",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  // ── Events ──
  {
    name: "ContractMinted",
    type: "event",
    inputs: [
      { name: "tokenId",     type: "uint256", indexed: true  },
      { name: "farmer",      type: "address", indexed: true  },
      { name: "metadataURI", type: "string",  indexed: false },
      { name: "priceUsdc",   type: "uint256", indexed: false },
    ],
  },
  {
    name: "ContractPurchased",
    type: "event",
    inputs: [
      { name: "tokenId",   type: "uint256", indexed: true  },
      { name: "buyer",     type: "address", indexed: true  },
      { name: "priceUsdc", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ContractRedeemed",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "buyer",   type: "address", indexed: true },
    ],
  },
  {
    name: "SecondaryListed",
    type: "event",
    inputs: [
      { name: "tokenId",   type: "uint256", indexed: true  },
      { name: "seller",    type: "address", indexed: true  },
      { name: "priceUsdc", type: "uint256", indexed: false },
    ],
  },
  {
    name: "SecondaryPurchased",
    type: "event",
    inputs: [
      { name: "tokenId",       type: "uint256", indexed: true  },
      { name: "buyer",         type: "address", indexed: true  },
      { name: "priceUsdc",     type: "uint256", indexed: false },
      { name: "farmer",        type: "address", indexed: false },
      { name: "farmerRoyalty", type: "uint256", indexed: false },
      { name: "platformFee",   type: "uint256", indexed: false },
    ],
  },
] as const;

// ─── ERC-20 (USDC) ABI (minimal) ──────────────────────────────────────────────

export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert human-readable USDC (e.g. 500) → atomic units (6 decimals) */
export function toUsdcAtoms(amount: number): bigint {
  return BigInt(Math.round(amount * 1_000_000));
}

/** Convert atomic USDC units → human-readable (e.g. 500_000_000 → "500.00") */
export function fromUsdcAtoms(atoms: bigint): string {
  const n = Number(atoms) / 1_000_000;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
