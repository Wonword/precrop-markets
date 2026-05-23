"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  ArrowUpRight,
  PackageCheck,
  ShoppingBag,
  Loader2,
  Search,
  Wallet,
} from "lucide-react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { CONTRACT_ADDRESSES, NFT_ABI, contractsReady, fromUsdcAtoms } from "@/lib/web3/contracts";

type EventType = "purchase" | "redeem";

type HistoryEvent = {
  id: string;
  type: EventType;
  tokenId: bigint;
  amountUsdc: string;
  txHash: `0x${string}`;
  blockNumber: bigint;
  timestamp?: number; // unix seconds
  cropName?: string;
  imageUrl?: string;
};

const PURCHASED_EVENT = parseAbiItem(
  "event ContractPurchased(uint256 indexed tokenId, address indexed buyer, uint256 priceUsdc)"
);
const REDEEMED_EVENT = parseAbiItem(
  "event ContractRedeemed(uint256 indexed tokenId, address indexed buyer)"
);

function TxLink({ hash }: { hash: `0x${string}` }) {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "84532");
  const base = chainId === 8453 ? "https://basescan.org/tx/" : "https://sepolia.basescan.org/tx/";
  return (
    <a
      href={`${base}${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-[#1B5E55] hover:underline"
    >
      {hash.slice(0, 10)}…
      <ArrowUpRight size={11} />
    </a>
  );
}

function formatDate(timestamp?: number) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BuyerHistoryPage() {
  const { address, isConnected } = useAccount();
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "84532");
  const publicClient = usePublicClient({ chainId });

  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !publicClient || !contractsReady) return;

    setLoading(true);
    setError(null);

    const loadHistory = async () => {
      try {
        // Fetch purchase and redeem logs in parallel
        const [purchaseLogs, redeemLogs] = await Promise.all([
          publicClient.getLogs({
            address: CONTRACT_ADDRESSES.market,
            event: PURCHASED_EVENT,
            args: { buyer: address },
            fromBlock: BigInt(0),
          }),
          publicClient.getLogs({
            address: CONTRACT_ADDRESSES.market,
            event: REDEEMED_EVENT,
            args: { buyer: address },
            fromBlock: BigInt(0),
          }),
        ]);

        // Collect unique token IDs to fetch metadata
        const tokenIds = new Set<bigint>();
        purchaseLogs.forEach((l) => l.args.tokenId !== undefined && tokenIds.add(l.args.tokenId));
        redeemLogs.forEach((l) => l.args.tokenId !== undefined && tokenIds.add(l.args.tokenId));

        // Fetch tokenURI for each token
        const metaMap = new Map<string, { cropName?: string; imageUrl?: string }>();
        await Promise.allSettled(
          Array.from(tokenIds).map(async (tokenId) => {
            try {
              const uri = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.nft,
                abi: NFT_ABI,
                functionName: "tokenURI",
                args: [tokenId],
              });
              if (!uri) return;
              // Handle IPFS or HTTP URIs
              const url = uri.startsWith("ipfs://")
                ? uri.replace("ipfs://", "https://ipfs.io/ipfs/")
                : uri;
              const res = await globalThis.fetch(url);
              if (!res.ok) return;
              const json = await res.json();
              metaMap.set(tokenId.toString(), {
                cropName: json.name ?? json.cropName ?? undefined,
                imageUrl: json.image ?? json.imageUrl ?? undefined,
              });
            } catch {
              // metadata unavailable — show token ID only
            }
          })
        );

        // Fetch block timestamps for all unique blocks
        const blockNums = new Set<bigint>();
        [...purchaseLogs, ...redeemLogs].forEach((l) => {
          if (l.blockNumber) blockNums.add(l.blockNumber);
        });
        const blockTimestamps = new Map<string, number>();
        await Promise.allSettled(
          Array.from(blockNums).map(async (bn) => {
            try {
              const block = await publicClient.getBlock({ blockNumber: bn });
              blockTimestamps.set(bn.toString(), Number(block.timestamp));
            } catch {
              // timestamp unavailable
            }
          })
        );

        // Build event list
        const result: HistoryEvent[] = [];

        for (const log of purchaseLogs) {
          const { tokenId, priceUsdc } = log.args;
          if (tokenId === undefined) continue;
          const meta = metaMap.get(tokenId.toString()) ?? {};
          result.push({
            id: `purchase-${log.transactionHash}-${tokenId}`,
            type: "purchase",
            tokenId,
            amountUsdc: priceUsdc !== undefined ? fromUsdcAtoms(priceUsdc) : "—",
            txHash: log.transactionHash,
            blockNumber: log.blockNumber ?? BigInt(0),
            timestamp: log.blockNumber
              ? blockTimestamps.get(log.blockNumber.toString())
              : undefined,
            cropName: meta.cropName,
            imageUrl: meta.imageUrl,
          });
        }

        for (const log of redeemLogs) {
          const { tokenId } = log.args;
          if (tokenId === undefined) continue;
          const meta = metaMap.get(tokenId.toString()) ?? {};
          // Find the original purchase price for display
          const purchaseLog = purchaseLogs.find((p) => p.args.tokenId === tokenId);
          const amountUsdc =
            purchaseLog?.args.priceUsdc !== undefined
              ? fromUsdcAtoms(purchaseLog.args.priceUsdc)
              : "—";
          result.push({
            id: `redeem-${log.transactionHash}-${tokenId}`,
            type: "redeem",
            tokenId,
            amountUsdc,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber ?? BigInt(0),
            timestamp: log.blockNumber
              ? blockTimestamps.get(log.blockNumber.toString())
              : undefined,
            cropName: meta.cropName,
            imageUrl: meta.imageUrl,
          });
        }

        // Sort newest first
        result.sort((a, b) => {
          if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
          return Number(b.blockNumber - a.blockNumber);
        });

        setEvents(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [address, publicClient, chainId]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-[#ADC2B5] font-medium uppercase tracking-widest mb-1">
            Buyer Portal
          </p>
          <h1
            className="text-3xl font-bold text-[#1B5E55]"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            Transaction History
          </h1>
          {!loading && isConnected && (
            <p className="text-gray-500 text-sm mt-1">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 bg-[#88C057] hover:bg-[#6fa344] text-black font-semibold px-5 py-2.5 rounded-full transition-colors text-sm whitespace-nowrap self-start sm:self-auto"
        >
          <Search size={15} />
          Browse Contracts
        </Link>
      </div>

      {/* Wallet not connected */}
      {!isConnected && (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center space-y-3">
          <Wallet size={32} className="text-[#ADC2B5] mx-auto" />
          <p className="text-gray-500 text-sm">Connect your wallet to view your transaction history.</p>
        </div>
      )}

      {/* Contracts not deployed */}
      {isConnected && !contractsReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-700 text-center">
          Contracts not yet deployed to this network.
        </div>
      )}

      {/* Loading */}
      {isConnected && contractsReady && loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={24} className="animate-spin text-[#1B5E55]" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Empty */}
      {isConnected && contractsReady && !loading && !error && events.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Clock size={32} className="text-[#ADC2B5] mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No transactions found for this wallet.</p>
          <Link
            href="/marketplace"
            className="inline-block mt-4 text-sm font-semibold text-[#1B5E55] hover:underline"
          >
            Browse available contracts →
          </Link>
        </div>
      )}

      {/* Timeline */}
      {!loading && events.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-4 p-5 hover:bg-[#F8FAF8] transition-colors"
            >
              {/* Icon */}
              <div
                className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  event.type === "purchase" ? "bg-[#1B5E55]/10" : "bg-[#88C057]/15"
                }`}
              >
                {event.type === "purchase" ? (
                  <ShoppingBag size={16} className="text-[#1B5E55]" />
                ) : (
                  <PackageCheck size={16} className="text-[#88C057]" />
                )}
              </div>

              {/* Thumbnail */}
              {event.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.imageUrl}
                  alt={event.cropName ?? `Token #${event.tokenId}`}
                  className="hidden sm:block w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="hidden sm:block w-12 h-12 rounded-lg bg-gradient-to-br from-[#1B5E55] to-[#88C057] shrink-0" />
              )}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#1B5E55] text-sm leading-tight">
                      {event.type === "purchase" ? "Purchased" : "Redeemed"}{" "}
                      <span className="font-bold">
                        {event.cropName ?? `Token #${event.tokenId}`}
                      </span>
                    </p>
                    {event.timestamp && (
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.timestamp)}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#1B5E55]">
                      {event.amountUsdc}{" "}
                      <span className="font-normal text-gray-400">USDC</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Block #{event.blockNumber.toString()}</p>
                  </div>
                </div>

                <div className="mt-2">
                  <TxLink hash={event.txHash} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
