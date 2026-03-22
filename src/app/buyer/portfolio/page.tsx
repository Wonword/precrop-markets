"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, Loader2 } from "lucide-react";
import NFTCard from "@/components/buyer/NFTCard";
import RedeemModal from "@/components/buyer/RedeemModal";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { OwnedContract } from "@/lib/mockPortfolio";
import type { CropContract, ContractStatus, CropCategory, QualityStandards } from "@/types/contract";

const FILTERS = ["All", "Available", "Redeemable", "Redeemed"] as const;
type FilterOption = (typeof FILTERS)[number];

// Extend OwnedContract to carry the purchase row id for Supabase updates
type PortfolioItem = OwnedContract & { purchaseId: string };

export default function BuyerPortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("All");
  const [redeemTarget, setRedeemTarget] = useState<PortfolioItem | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!user?.id) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("purchases")
      .select("*, contracts(*, farms(farm_name, contact_name, region, state, country))")
      .eq("buyer_id", user.id)
      .order("purchased_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const rows = data as unknown as Array<Record<string, unknown>>;
    const items: PortfolioItem[] = rows.map((row) => {
      const c = row.contracts as Record<string, unknown> | null;
      const farm = (c?.farms as Record<string, unknown> | null) ?? {};

      const contract: CropContract = {
        id: String(c?.id ?? row.contract_id ?? ""),
        tokenId: Number(c?.token_id ?? 0),
        cropName: String(c?.crop_name ?? ""),
        cropCategory: (c?.crop_category as CropCategory) ?? "specialty",
        farmName: String(farm.farm_name ?? ""),
        farmerName: String(farm.contact_name ?? ""),
        region: String(farm.region ?? ""),
        state: String(farm.state ?? ""),
        country: String(farm.country ?? "USA"),
        harvestDate: c?.harvest_date ? String(c.harvest_date) : undefined,
        deliveryDate: String(c?.delivery_date ?? ""),
        deliveryMethod: c?.delivery_method ? String(c.delivery_method) : undefined,
        deliveryLocation: c?.delivery_location ? String(c.delivery_location) : undefined,
        quantityUnits: Number(c?.quantity_units ?? 0),
        unitType: String(c?.unit_type ?? ""),
        unitSizeLbs: c?.unit_size_lbs ? Number(c.unit_size_lbs) : undefined,
        pricePerUnitUsdc: Number(c?.price_per_unit_usdc ?? 0),
        totalValueUsdc: Number(c?.total_value_usdc ?? 0),
        gradingStandard: c?.grading_standard ? String(c.grading_standard) : undefined,
        qualityStandards: (c?.quality_standards as QualityStandards) ?? undefined,
        dockage: c?.dockage ? String(c.dockage) : undefined,
        notes: c?.notes ? String(c.notes) : undefined,
        status: (c?.status as ContractStatus) ?? "sold",
        description: String(c?.description ?? ""),
        placeholderGradient: String(c?.placeholder_gradient ?? "from-[#1B5E55] to-[#88C057]"),
        mintedAt: String(c?.minted_at ?? new Date().toISOString()),
        contractAddress: c?.contract_address ? String(c.contract_address) : undefined,
        imageUrl: c?.image_url ? String(c.image_url) : undefined,
      };

      return {
        contract,
        purchasedAt: String(row.purchased_at ?? ""),
        paidUsdc: Number(row.paid_usdc ?? 0),
        deliveryAddress: row.delivery_address ? String(row.delivery_address) : undefined,
        purchaseId: String(row.id ?? ""),
      };
    });

    setPortfolio(items);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchPortfolio();
  }, [user, authLoading, fetchPortfolio]);

  const handleRedeemSuccess = async ({
    deliveryAddress,
    txHash,
  }: {
    deliveryAddress: string;
    txHash?: string;
  }) => {
    if (!redeemTarget) return;
    const supabase = createClient();

    await supabase
      .from("purchases")
      .update({
        redeemed_at: new Date().toISOString(),
        redeem_tx_hash: txHash ?? null,
        delivery_address: deliveryAddress,
      })
      .eq("id", redeemTarget.purchaseId);

    setRedeemTarget(null);
    fetchPortfolio();
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-[#1B5E55]" />
      </div>
    );
  }

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
      {portfolio.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-gray-400 text-sm">You haven&apos;t purchased any contracts yet.</p>
          <Link
            href="/marketplace"
            className="inline-block mt-4 text-sm font-semibold text-[#1B5E55] hover:underline"
          >
            Browse available contracts →
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-gray-400 text-sm">No NFTs with status &quot;{filter}&quot;.</p>
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
          onSuccess={handleRedeemSuccess}
        />
      )}
    </div>
  );
}
