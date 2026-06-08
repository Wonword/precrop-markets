import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Package,
  Shield,
  ExternalLink,
  Sprout,
  User,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import StatusBadge from "@/components/marketplace/StatusBadge";
import BuyPanel from "@/components/marketplace/BuyPanel";
import { mockContracts } from "@/lib/mockContracts";
import { createClient } from "@/lib/supabase/server";
import { NETWORK_LABEL } from "@/lib/web3/contracts";
import type { CropContract, ContractStatus, CropCategory, QualityStandards } from "@/types/contract";

// The route is fully dynamic (server-side Supabase fetch uses cookies()).
// All contract IDs — including farmer-minted ones not known at build time —
// are served on-demand with live data.

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

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

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Try the DB first so farmer-minted contracts (not in mockContracts) are
  // accessible, and so live status changes (e.g. sold) are reflected.
  let contract: CropContract | undefined;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contracts")
      .select("*, farms(farm_name, contact_name, region, state, country, email, phone)")
      .eq("id", id)
      .single();

    if (!error && data) {
      contract = rowToContract(data as unknown as Record<string, unknown>);
    } else if (error && error.code !== "PGRST116") {
      // PGRST116 = "no rows returned" — that's expected for unknown IDs, don't log it
      console.error(`[ContractDetailPage] DB error for id=${id}:`, error);
    }
  } catch (e) {
    console.error(`[ContractDetailPage] unexpected error fetching id=${id}:`, e);
  }

  // Fall back to mock data (covers edge cases where DB is unreachable)
  if (!contract) {
    const mock = mockContracts.find((c) => c.id === id);
    if (mock) contract = mock;
  }

  if (!contract) notFound();

  return (
    <div className="min-h-screen bg-[#F2F4F3] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-6 max-w-6xl mx-auto w-full">
        {/* Back */}
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm text-[#1B5E55] font-medium hover:text-[#143f39] mb-8 group"
        >
          <ArrowLeft
            size={15}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left col: image + details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Hero image */}
            <div
              className={`relative rounded-2xl overflow-hidden h-72 bg-gradient-to-br ${contract.placeholderGradient}`}
            >
              {contract.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={contract.imageUrl}
                  alt={contract.cropName}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5 flex items-center gap-3 z-10">
                <StatusBadge status={contract.status} />
                <span className="text-white/90 text-sm font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                  NFT #{contract.tokenId}
                </span>
              </div>
            </div>

            {/* Main info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7 space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#1B5E55]/50">
                  {contract.cropCategory}
                </span>
                <h1
                  className="text-3xl font-bold text-[#1B5E55] mt-1 leading-tight"
                  style={{
                    fontFamily: "var(--font-space-grotesk, sans-serif)",
                  }}
                >
                  {contract.cropName}
                </h1>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  {
                    icon: <User size={14} />,
                    label: "Farmer",
                    value: contract.farmerName,
                  },
                  {
                    icon: <MapPin size={14} />,
                    label: "Location",
                    value: `${contract.region}, ${contract.state}`,
                  },
                  {
                    icon: <Package size={14} />,
                    label: "Quantity",
                    value: `${contract.quantityUnits.toLocaleString()} ${contract.unitType}${contract.unitSizeLbs ? ` (${contract.unitSizeLbs.toLocaleString()} lbs each)` : ""}`,
                  },
                  ...(contract.harvestDate ? [{
                    icon: <Calendar size={14} />,
                    label: "Harvest",
                    value: formatDate(contract.harvestDate),
                  }] : []),
                  {
                    icon: <Calendar size={14} />,
                    label: "Earliest Delivery",
                    value: formatDate(contract.deliveryDate),
                  },
                  ...(contract.gradingStandard ? [{
                    icon: <Shield size={14} />,
                    label: "Grading",
                    value: contract.gradingStandard,
                  }] : []),
                ].map(({ icon, label, value }) => (
                  <div key={label} className="space-y-1">
                    <p className="flex items-center gap-1.5 text-xs text-gray-400 font-medium uppercase tracking-wider">
                      <span className="text-[#ADC2B5]">{icon}</span>
                      {label}
                    </p>
                    <p className="text-[#333333] font-medium text-sm leading-snug">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h2 className="font-semibold text-[#1B5E55] mb-2 text-sm">
                  About This Crop
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {contract.description}
                </p>
              </div>

              {/* Quality Standards */}
              {contract.qualityStandards && Object.values(contract.qualityStandards).some(Boolean) && (
                <div className="border-t border-gray-100 pt-4">
                  <h2 className="font-semibold text-[#1B5E55] mb-3 text-sm">
                    Quality Standards
                  </h2>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {[
                      { label: "Moisture", value: contract.qualityStandards.moisture },
                      { label: "Total Defects", value: contract.qualityStandards.totalDefects },
                      { label: "Total Damaged", value: contract.qualityStandards.totalDamaged },
                      { label: "Foreign Material", value: contract.qualityStandards.foreignMaterial },
                      { label: "Contrasting", value: contract.qualityStandards.contrasting },
                      { label: "Test Weight", value: contract.qualityStandards.testWeight },
                    ]
                      .filter(({ value }) => value)
                      .map(({ label, value }) => (
                        <div key={label} className="flex justify-between border-b border-gray-50 pb-1.5">
                          <span className="text-gray-400">{label}</span>
                          <span className="font-medium text-[#333333]">{value}</span>
                        </div>
                      ))}
                  </div>
                  {contract.qualityStandards.specialMetrics && (
                    <p className="mt-3 text-xs text-gray-500 bg-[#F2F4F3] rounded-xl px-4 py-3 leading-relaxed">
                      <span className="font-semibold text-[#1B5E55]">Special Metrics: </span>
                      {contract.qualityStandards.specialMetrics}
                    </p>
                  )}
                </div>
              )}

              {/* Delivery & Dockage */}
              {(contract.deliveryMethod || contract.deliveryLocation || contract.dockage) && (
                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                  <h2 className="font-semibold text-[#1B5E55] mb-2">Delivery Terms</h2>
                  {contract.deliveryMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Method</span>
                      <span className="font-medium text-[#333333]">{contract.deliveryMethod}</span>
                    </div>
                  )}
                  {contract.deliveryLocation && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location</span>
                      <span className="font-medium text-[#333333]">{contract.deliveryLocation}</span>
                    </div>
                  )}
                  {contract.dockage && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dockage</span>
                      <span className="font-medium text-[#333333] text-right max-w-[60%]">{contract.dockage}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Farm card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1B5E55]/10 flex items-center justify-center flex-shrink-0">
                  <Sprout size={20} className="text-[#1B5E55]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#1B5E55] text-base">
                    {contract.farmName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {contract.region}, {contract.state} · {contract.country}
                  </p>
                  {contract.farmerName && (
                    <p className="text-sm text-gray-600 mt-1">Contact: {contract.farmerName}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {contract.farmerEmail && (
                      <a href={`mailto:${contract.farmerEmail}`} className="text-xs text-[#1B5E55] hover:underline">
                        {contract.farmerEmail}
                      </a>
                    )}
                    {contract.farmerPhone && (
                      <a href={`tel:${contract.farmerPhone}`} className="text-xs text-[#1B5E55] hover:underline">
                        {contract.farmerPhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right col: purchase panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-7 sticky top-24 space-y-6">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                  Contract Value
                </p>
                <div className="flex items-end gap-2">
                  <span
                    className="text-4xl font-bold text-[#1B5E55]"
                    style={{
                      fontFamily: "var(--font-space-grotesk, sans-serif)",
                    }}
                  >
                    {contract.totalValueUsdc.toLocaleString()}
                  </span>
                  <span className="text-gray-400 text-lg mb-1">USDC</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {contract.pricePerUnitUsdc.toLocaleString()} USDC/{contract.unitType} ·{" "}
                  {contract.quantityUnits.toLocaleString()} {contract.unitType}
                  {contract.unitSizeLbs ? `s (${(contract.quantityUnits * contract.unitSizeLbs).toLocaleString()} lbs total)` : ""}
                </p>
              </div>

              {/* Action button */}
              <BuyPanel contract={contract} />

              {/* Pay with card note */}
              {contract.status === "available" && (
                <p className="text-xs text-center text-gray-400">
                  Pay with credit card — converted to USDC automatically via
                  Coinbase
                </p>
              )}

              {/* On-chain details */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  On-Chain Details
                </p>
                {[
                  { label: "Network", value: NETWORK_LABEL },
                  { label: "Standard", value: "ERC-721" },
                  { label: "Token ID", value: `#${contract.tokenId}` },
                  { label: "Gas Fees", value: "Sponsored by Precrop" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-400">{label}</span>
                    <span className="text-[#333333] font-medium">{value}</span>
                  </div>
                ))}
                {contract.contractAddress && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Contract</span>
                    <a
                      href={`https://basescan.org/address/${contract.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1B5E55] font-medium flex items-center gap-1 hover:underline"
                    >
                      {contract.contractAddress.slice(0, 8)}…
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
