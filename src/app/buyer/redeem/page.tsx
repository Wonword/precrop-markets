"use client";

import { useState, useEffect, useCallback } from "react";
import { PackageCheck, Inbox, Loader2 } from "lucide-react";
import NFTCard from "@/components/buyer/NFTCard";
import RedeemModal from "@/components/buyer/RedeemModal";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { OwnedContract } from "@/lib/mockPortfolio";
import type { CropContract, ContractStatus, CropCategory, QualityStandards } from "@/types/contract";

type PortfolioItem = OwnedContract & { purchaseId: string };

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

export default function RedeemPage() {
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

  const redeemable = portfolio.filter((o) => o.contract.status === "redeemable");
  const redeemed = portfolio.filter((o) => o.contract.status === "redeemed");

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
      <div>
        <p className="text-sm text-[#ADC2B5] font-medium uppercase tracking-widest mb-1">Buyer Portal</p>
        <h1 className="text-3xl font-bold text-[#1B5E55]" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
          Redeem Contracts
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          These contracts have been harvested and are ready for delivery. Redeem your NFT to initiate shipment.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-[#1B5E55] text-sm mb-4 uppercase tracking-widest">How Redemption Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Enter Delivery Address", desc: "Confirm where you want the crop shipped to." },
            { step: "2", title: "Sign on Base", desc: "Your NFT is burned and the farmer receives payment — gasless via Coinbase Paymaster." },
            { step: "3", title: "Receive Delivery", desc: "The farmer ships your crop to the confirmed address within the agreed window." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1B5E55] text-white text-sm font-bold flex items-center justify-center shrink-0">{step}</div>
              <div>
                <p className="font-semibold text-[#1B5E55] text-sm">{title}</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Redeemable contracts */}
      {redeemable.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <PackageCheck size={18} className="text-[#88C057]" />
            <h2 className="font-bold text-[#1B5E55] text-lg" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
              Ready to Redeem ({redeemable.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {redeemable.map((owned) => (
              <NFTCard
                key={owned.contract.id}
                owned={owned}
                onRedeem={(id) => {
                  const target = redeemable.find((o) => o.contract.id === id);
                  if (target) setRedeemTarget(target);
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#ADC2B5]/20 flex items-center justify-center">
            <Inbox size={28} className="text-[#ADC2B5]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1B5E55]" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
              No contracts ready yet
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Check back here when your contracted crops have been harvested.
            </p>
          </div>
        </div>
      )}

      {/* Recently redeemed */}
      {redeemed.length > 0 && (
        <div>
          <h2 className="font-bold text-[#1B5E55] text-lg mb-4" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
            Redeemed ✓
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {redeemed.map((owned) => (
              <NFTCard key={owned.contract.id} owned={owned} />
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
