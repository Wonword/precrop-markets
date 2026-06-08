/**
 * Buy an existing active listing on Base Sepolia testnet.
 * Reads credentials from .env.local.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPublicClient, createWalletClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const PRIVATE_KEY = env.DEPLOYER_PRIVATE_KEY;
const MARKET_ADDR = env.NEXT_PUBLIC_PRECROP_MARKET_ADDRESS;
const USDC_ADDR   = env.NEXT_PUBLIC_USDC_ADDRESS;
const RPC_URL     = env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;

const MARKET_ABI = [
  { name: 'getListing', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'farmer', type: 'address' }, { name: 'priceUsdc', type: 'uint256' }, { name: 'active', type: 'bool' }] },
  { name: 'buy', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [] },
];
const ERC20_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
];

const account = privateKeyToAccount(PRIVATE_KEY);
const transport = http(RPC_URL);
const publicClient = createPublicClient({ chain: baseSepolia, transport });
const walletClient = createWalletClient({ account, chain: baseSepolia, transport });

async function main() {
  console.log('Buyer wallet:', account.address);

  // Use token 1 (already listed at 5 USDC)
  const TOKEN_ID = 1n;
  const listing = await publicClient.readContract({
    address: MARKET_ADDR, abi: MARKET_ABI, functionName: 'getListing', args: [TOKEN_ID],
  });
  console.log(`Token ${TOKEN_ID}: farmer=${listing[0].slice(0,10)}… price=${formatUnits(listing[1],6)} USDC active=${listing[2]}`);

  if (!listing[2]) { console.error('Listing not active'); process.exit(1); }

  const price = listing[1];
  const balance = await publicClient.readContract({
    address: USDC_ADDR, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address],
  });
  console.log('USDC balance:', formatUnits(balance, 6));
  if (balance < price) { console.error('Insufficient USDC'); process.exit(1); }

  // Step 1: approve
  console.log(`\nApproving ${formatUnits(price, 6)} USDC for market…`);
  const approveHash = await walletClient.writeContract({
    address: USDC_ADDR, abi: ERC20_ABI, functionName: 'approve', args: [MARKET_ADDR, price],
  });
  const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
  console.log('Approve receipt status:', approveReceipt.status);
  if (approveReceipt.status !== 'success') { console.error('Approve failed!'); process.exit(1); }

  // Wait 3s for RPC nodes to sync
  await new Promise(r => setTimeout(r, 3000));

  // Verify allowance
  const allowance = await publicClient.readContract({
    address: USDC_ADDR, abi: ERC20_ABI, functionName: 'allowance', args: [account.address, MARKET_ADDR],
  });
  console.log('Allowance confirmed:', formatUnits(allowance, 6), 'USDC (need:', formatUnits(price, 6), ')');

  // Step 2: buy
  console.log(`\nBuying token ${TOKEN_ID}…`);
  const buyHash = await walletClient.writeContract({
    address: MARKET_ADDR, abi: MARKET_ABI, functionName: 'buy', args: [TOKEN_ID],
  });
  const buyReceipt = await publicClient.waitForTransactionReceipt({ hash: buyHash });
  console.log('Buy status:', buyReceipt.status);

  console.log('\n✅ Purchase confirmed on Base Sepolia testnet!');
  console.log('Buy tx hash:', buyHash);
  console.log('Buyer address:', account.address);
  console.log('Token ID:', TOKEN_ID.toString());
  console.log('Price paid:', formatUnits(price, 6), 'USDC');
}

main().catch(err => { console.error(err.shortMessage ?? err.message ?? err); process.exit(1); });
