"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Sprout } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ContractCard from "@/components/marketplace/ContractCard";
import FilterBar from "@/components/marketplace/FilterBar";
import { mockContracts } from "@/lib/mockContracts";
import { createClient } from "@/lib/supabase/client";
import type { CropContract, ContractStatus, CropCategory, QualityStandards } from "@/types/contract";

// Map a Supabase contracts row (with optional farms join) to a CropContract.
// For seeded contracts that have no linked farm record, falls back to the
// corresponding mockContracts entry for farm name / location fields.
function rowToContract(row: Record<string, unknown>): CropContract {
  const farm = row.farms as Record<string, unknown> | null;
  const mock = mockContracts.find((m) => m.id === String(row.id));
  const qs = row.quality_standards as QualityStandards | null;

  return {
    id: String(row.id),
    tokenId: Number(row.token_id ?? mock?.tokenId ?? 0),
    cropName: String(row.crop_name ?? mock?.cropName ?? ""),
    cropCategory: (row.crop_category ?? mock?.cropCategory ?? "specialty") as CropCategory,
    farmName: String(farm?.farm_name ?? mock?.farmName ?? ""),
    farmerName: String(farm?.contact_name ?? mock?.farmerName ?? ""),
    farmerEmail: (farm?.email as string | undefined) ?? mock?.farmerEmail,
    farmerPhone: (farm?.phone as string | undefined) ?? mock?.farmerPhone,
    region: String(farm?.region ?? mock?.region ?? ""),
    state: String(farm?.state ?? mock?.state ?? ""),
    country: String(farm?.country ?? mock?.country ?? "USA"),
    harvestDate: row.harvest_date ? String(row.harvest_date) : mock?.harvestDate,
    deliveryDate: String(row.delivery_date ?? mock?.deliveryDate ?? ""),
    deliveryMethod: row.delivery_method ? String(row.delivery_method) : mock?.deliveryMethod,
    deliveryLocation: row.delivery_location ? String(row.delivery_location) : mock?.deliveryLocation,
    quantityUnits: Number(row.quantity_units ?? mock?.quantityUnits ?? 0),
    unitType: String(row.unit_type ?? mock?.unitType ?? ""),
    unitSizeLbs: row.unit_size_lbs != null ? Number(row.unit_size_lbs) : mock?.unitSizeLbs,
    pricePerUnitUsdc: Number(row.price_per_unit_usdc ?? mock?.pricePerUnitUsdc ?? 0),
    totalValueUsdc: Number(row.total_value_usdc ?? mock?.totalValueUsdc ?? 0),
    gradingStandard: row.grading_standard ? String(row.grading_standard) : mock?.gradingStandard,
    qualityStandards: (qs ?? mock?.qualityStandards) ?? undefined,
    dockage: row.dockage ? String(row.dockage) : mock?.dockage,
    notes: row.notes ? String(row.notes) : mock?.notes,
    status: (row.status ?? mock?.status ?? "available") as ContractStatus,
    description: String(row.description ?? mock?.description ?? ""),
    placeholderGradient: String(
      row.placeholder_gradient ?? mock?.placeholderGradient ?? "from-[#1B5E55] to-[#88C057]"
    ),
    mintedAt: String(row.minted_at ?? mock?.mintedAt ?? new Date().toISOString()),
    contractAddress: row.contract_address ? String(row.contract_address) : mock?.contractAddress,
    imageUrl: row.image_url ? String(row.image_url) : mock?.imageUrl,
  };
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Seed with mock data so the page renders immediately on first paint,
  // then replace with live DB data so farmer-minted contracts appear too.
  const [contracts, setContracts] = useState<CropContract[]>(mockContracts);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("contracts")
          .select("*, farms(farm_name, contact_name, region, state, country, email, phone)")
          .order("minted_at", { ascending: false });

        if (error) {
          console.error("[MarketplacePage] failed to fetch contracts from DB:", error);
          return; // keep mock data
        }

        if (data && data.length > 0) {
          setContracts((data as unknown as Array<Record<string, unknown>>).map(rowToContract));
        }
      } catch (e) {
        console.error("[MarketplacePage] unexpected error fetching contracts:", e);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let result: CropContract[] = [...contracts];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.cropName.toLowerCase().includes(q) ||
          c.farmName.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q)
      );
    }

    // Category
    if (category !== "All") {
      result = result.filter(
        (c) => c.cropCategory === (category.toLowerCase() as CropCategory)
      );
    }

    // Status
    if (status !== "all") {
      result = result.filter((c) => c.status === (status as ContractStatus));
    }

    // Sort
    switch (sortBy) {
      case "delivery":
        result.sort(
          (a, b) =>
            new Date(a.deliveryDate).getTime() -
            new Date(b.deliveryDate).getTime()
        );
        break;
      case "price-asc":
        result.sort((a, b) => a.totalValueUsdc - b.totalValueUsdc);
        break;
      case "price-desc":
        result.sort((a, b) => b.totalValueUsdc - a.totalValueUsdc);
        break;
      case "quantity":
        result.sort((a, b) => b.quantityUnits - a.quantityUnits);
        break;
      default: // newest
        result.sort(
          (a, b) =>
            new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime()
        );
    }

    return result;
  }, [search, category, status, sortBy, contracts]);

  const openCount = contracts.filter((c) => c.status === "available").length;
  const totalUsdc = contracts.reduce((sum, c) => sum + c.totalValueUsdc, 0);

  return (
    <div className="min-h-screen bg-[#F2F4F3] flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="bg-[#1B5E55] pt-24 pb-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[#ADC2B5] text-sm font-medium uppercase tracking-widest mb-2">
              On-Chain · Base Network
            </p>
            <h1
              className="text-white text-4xl md:text-5xl font-bold leading-tight"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              Crop Futures
              <br />
              <span className="text-[#88C057]">Marketplace</span>
            </h1>
            <p className="text-white/60 mt-3 text-base max-w-md">
              Browse and purchase micro-futures contracts directly from
              independent farmers. Each contract is a unique NFT on Base.
            </p>
          </div>

          {/* Summary stats */}
          <div className="flex gap-6 md:gap-10">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {openCount}
              </div>
              <div className="text-xs text-white/50 mt-1">Open Contracts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#88C057]">
                {(totalUsdc / 1000).toFixed(1)}k
              </div>
              <div className="text-xs text-white/50 mt-1">USDC Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {contracts.length}
              </div>
              <div className="text-xs text-white/50 mt-1">Total Listings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        search={search}
        onSearch={setSearch}
        category={category}
        onCategory={setCategory}
        status={status}
        onStatus={setStatus}
        sortBy={sortBy}
        onSort={setSortBy}
        total={filtered.length}
      />

      {/* Contract grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-10 py-10">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((contract) => (
              <ContractCard key={contract.id} contract={contract} />
            ))}

            {/* Farmer CTA card */}
            <Link
              href="/farmer"
              className="flex flex-col items-center justify-center gap-4 bg-white border-2 border-dashed border-[#ADC2B5] rounded-2xl p-8 hover:border-[#1B5E55] hover:bg-[#1B5E55]/5 transition-all group min-h-[300px]"
            >
              <div className="w-14 h-14 rounded-full bg-[#1B5E55]/10 flex items-center justify-center group-hover:bg-[#1B5E55]/20 transition-colors">
                <Plus size={26} className="text-[#1B5E55]" />
              </div>
              <div className="text-center">
                <p
                  className="font-bold text-[#1B5E55] text-base"
                  style={{
                    fontFamily: "var(--font-space-grotesk, sans-serif)",
                  }}
                >
                  List Your Crop
                </p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Are you a farmer? Create a micro-futures contract and get
                  funded before you plant.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#1B5E55] border border-[#1B5E55]/30 px-4 py-1.5 rounded-full group-hover:bg-[#1B5E55] group-hover:text-white transition-all">
                Start Listing →
              </span>
            </Link>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32 text-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#ADC2B5]/20 flex items-center justify-center">
              <Sprout size={28} className="text-[#ADC2B5]" />
            </div>
            <div>
              <p
                className="text-xl font-bold text-[#1B5E55]"
                style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
              >
                No contracts found
              </p>
              <p className="text-gray-400 mt-1 text-sm">
                Try adjusting your search or filters.
              </p>
            </div>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
                setStatus("all");
                setSortBy("newest");
              }}
              className="text-sm font-medium text-[#1B5E55] underline underline-offset-2 hover:text-[#143f39]"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
