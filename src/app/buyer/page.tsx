"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Calendar,
  PackageCheck,
  ArrowRight,
  Search,
  Loader2,
} from "lucide-react";
import NFTCard from "@/components/buyer/NFTCard";
import RedeemModal from "@/components/buyer/RedeemModal";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { OwnedContract } from "@/lib/mockPortfolio";
import type { CropContract, ContractStatus, CropCategory, QualityStandards } from "@/types/contract";

type PortfolioItem = OwnedContract & { purchaseId: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildContract(row: Record<string, unknown>): CropContract {
  const c = row.contracts as Record<string, unknown> | null;
  const farm = (c?.farms as Record<string, unknown> | null) ?? {};
  return {
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
}

export default function BuyerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemTarget, setRedeemTarget] = useState<PortfolioItem | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!user?.id) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("purchases")
      .select("*, contracts(*, farms(farm_name, contact_name, region, state, country))")
      .eq("buyer_id", user.id)
      .order("purchased_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const items: PortfolioItem[] = (data as unknown as Array<Record<string, unknown>>).map((row) => ({
      contract: buildContract(row),
      purchasedAt: String(row.purchased_at ?? ""),
      paidUsdc: Number(row.paid_usdc ?? 0),
      deliveryAddress: row.delivery_address ? String(row.delivery_address) : undefined,
      purchaseId: String(row.id ?? ""),
    }));

    setPortfolio(items);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) { setLoading(false); return; }
    fetchPortfolio();
  }, [user, authLoading, fetchPortfolio]);

  const handleRedeemSuccess = async ({ deliveryAddress, txHash }: { deliveryAddress: string; txHash?: string }) => {
    if (!redeemTarget) return;
    const supabase = createClient();
    await supabase.from("purchases").update({
      redeemed_at: new Date().toISOString(),
      redeem_tx_hash: txHash ?? null,
      delivery_address: deliveryAddress,
    }).eq("id", redeemTarget.purchaseId);
    setRedeemTarget(null);
    fetchPortfolio();
  };

  const totalInvested = portfolio.reduce((s, o) => s + o.paidUsdc, 0);
  const redeemable = portfolio.filter((o) => o.contract.status === "redeemable");
  const redeemed = portfolio.filter((o) => o.contract.status === "redeemed");
  const upcoming = portfolio
    .filter((o) => o.contract.status !== "redeemed" && o.contract.deliveryDate)
    .sort((a, b) => new Date(a.contract.deliveryDate).getTime() - new Date(b.contract.deliveryDate).getTime());

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
            Your Portfolio
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track your crop futures NFTs, upcoming deliveries, and redemptions.
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "NFTs Owned", value: portfolio.length, sub: "active contracts", icon: <Wallet size={20} className="text-[#1B5E55]" />, bg: "bg-[#1B5E55]/8" },
          { label: "Total Invested", value: totalInvested > 0 ? `${(totalInvested / 1000).toFixed(1)}k` : "0", sub: "USDC", icon: <TrendingUp size={20} className="text-[#88C057]" />, bg: "bg-[#88C057]/10" },
          { label: "Ready to Redeem", value: redeemable.length, sub: "awaiting your action", icon: <PackageCheck size={20} className="text-[#1B5E55]" />, bg: "bg-[#1B5E55]/8" },
          { label: "Completed", value: redeemed.length, sub: "deliveries received", icon: <Calendar size={20} className="text-[#ADC2B5]" />, bg: "bg-[#ADC2B5]/15" },
        ].map(({ label, value, sub, icon, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>{icon}</div>
            <div>
              <p className="text-2xl font-bold text-[#1B5E55]" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Redeemable alert */}
      {redeemable.length > 0 && (
        <div className="bg-[#1B5E55] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <PackageCheck size={24} className="text-[#88C057]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
              {redeemable.length} contract{redeemable.length > 1 ? "s are" : " is"} ready to redeem!
            </h3>
            <p className="text-white/60 text-sm mt-0.5">
              {redeemable.map((o) => o.contract.cropName).join(", ")} — harvest is complete.
            </p>
          </div>
          <Link href="/buyer/redeem" className="bg-[#88C057] hover:bg-[#6fa344] text-black font-semibold px-5 py-2.5 rounded-full text-sm transition-colors whitespace-nowrap shrink-0">
            Redeem Now →
          </Link>
        </div>
      )}

      {/* NFT grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1B5E55] text-xl" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
            My NFTs
          </h2>
          <Link href="/buyer/portfolio" className="text-sm text-[#1B5E55] font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {portfolio.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <p className="text-gray-400 text-sm">You haven&apos;t purchased any contracts yet.</p>
            <Link href="/marketplace" className="inline-block mt-4 text-sm font-semibold text-[#1B5E55] hover:underline">
              Browse available contracts →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {portfolio.slice(0, 6).map((owned) => (
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
      </div>

      {/* Upcoming deliveries */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#1B5E55] text-lg" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
              Upcoming Deliveries
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {upcoming.slice(0, 4).map((owned) => (
              <div key={owned.contract.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F2F4F3]/50 transition-colors">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${owned.contract.placeholderGradient} shrink-0 overflow-hidden`}>
                  {owned.contract.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={owned.contract.imageUrl} alt={owned.contract.cropName} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1B5E55] text-sm truncate">{owned.contract.cropName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{owned.contract.farmName} · {owned.contract.quantityUnits} {owned.contract.unitType}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#333333]">{formatDate(owned.contract.deliveryDate)}</p>
                  <p className="text-xs text-gray-400">{owned.paidUsdc.toLocaleString()} USDC</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
