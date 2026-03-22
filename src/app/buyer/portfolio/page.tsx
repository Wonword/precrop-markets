"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import NFTCard from "@/components/buyer/NFTCard";
import RedeemModal from "@/components/buyer/RedeemModal";
import { mockPortfolio, OwnedContract } from "@/lib/mockPortfolio";

const FILTERS = ["All", "Available", "Redeemable", "Redeemed"] as const;
type FilterOption = (typeof FILTERS)[number];

export default function BuyerPortfolioPage() {
  const [filter, setFilter] = useState<FilterOption>("All");
  const [redeemTarget, setRedeemTarget] = useState<OwnedContract | null>(null);
  const [redeemedIds, setRedeemedIds] = useState<string[]>([]);

  const portfolio = mockPortfolio.map((o) =>
    redeemedIds.includes(o.contract.id)
      ? { ...o, contract: { ...o.contract, status: "redeemed" as const } }
      : o
  );

  const filtered = portfolio.filter((o) => {
    if (filter === "All") return true;
    return o.contract.status === filter.toLowerCase();
  });

  const counts = {
    All: portfolio.length,
    Available: portfolio.filter((o) => o.contract.status === "available").length,
    Redeemable: portfolio.filter((o) => o.contract.status === "redeemable").length,
    Redeemed: portfolio.filter((o) => o.contract.status === "redeemed").length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
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
            My Portfolio
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {portfolio.length} NFT{portfolio.length !== 1 ? "s" : ""} owned
          </p>
        </div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 bg-[#88C057] hover:bg-[#6fa344] text-black font-semibold px-5 py-2.5 rounded-full transition-colors text-sm whitespace-nowrap self-start sm:self-auto"
        >
          <Search size={15} />
          Browse Contracts
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? "bg-[#1B5E55] text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-[#1B5E55] hover:text-[#1B5E55]"
            }`}
          >
            {f}
            <span className="ml-1.5 opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* NFT Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-gray-400 text-sm">No NFTs with status &quot;{filter}&quot;.</p>
          <Link
            href="/marketplace"
            className="inline-block mt-4 text-sm font-semibold text-[#1B5E55] hover:underline"
          >
            Browse available contracts →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((owned) => (
            <NFTCard
              key={owned.contract.id}
              owned={owned}
              onRedeem={(id) => {
                const target = portfolio.find((o) => o.contract.id === id);
                if (target) setRedeemTarget(target);
              }}
            />
          ))}
        </div>
      )}

      {/* Redeem modal */}
      {redeemTarget && (
        <RedeemModal
          contract={redeemTarget.contract}
          paidUsdc={redeemTarget.paidUsdc}
          onClose={() => setRedeemTarget(null)}
          onSuccess={() => {
            setRedeemedIds((ids) => [...ids, redeemTarget.contract.id]);
            setRedeemTarget(null);
          }}
        />
      )}
    </div>
  );
}
