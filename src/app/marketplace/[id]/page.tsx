import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Package,
  Shield,
  TrendingUp,
  ExternalLink,
  Sprout,
  User,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import StatusBadge from "@/components/marketplace/StatusBadge";
import { mockContracts } from "@/lib/mockContracts";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function generateStaticParams() {
  return mockContracts.map((c) => ({ id: c.id }));
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = mockContracts.find((c) => c.id === id);
  if (!contract) notFound();

  const pct = Math.min(
    100,
    Math.round((contract.fundedAmountUsdc / contract.totalValueUsdc) * 100)
  );
  const remaining = contract.totalValueUsdc - contract.fundedAmountUsdc;

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
              <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMCAwTDQgNE0tMSAxTDEgLTFNMyA1TDUgMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')]" />
              <div className="absolute bottom-5 left-5 flex items-center gap-3">
                <StatusBadge status={contract.status} />
                <span className="text-white/70 text-sm font-medium bg-black/25 px-3 py-1 rounded-full backdrop-blur-sm">
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
                    value: `${contract.quantityKg.toLocaleString()} kg`,
                  },
                  {
                    icon: <Calendar size={14} />,
                    label: "Harvest",
                    value: formatDate(contract.harvestDate),
                  },
                  {
                    icon: <Calendar size={14} />,
                    label: "Delivery",
                    value: formatDate(contract.deliveryDate),
                  },
                  {
                    icon: <Shield size={14} />,
                    label: "Grading",
                    value: contract.gradingStandard,
                  },
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
            </div>

            {/* Farm card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1B5E55]/10 flex items-center justify-center flex-shrink-0">
                  <Sprout size={20} className="text-[#1B5E55]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1B5E55] text-base">
                    {contract.farmName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {contract.region}, {contract.state} · {contract.country}
                  </p>
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
                  {contract.pricePerKgUsdc} USDC per kg ·{" "}
                  {contract.quantityKg.toLocaleString()} kg
                </p>
              </div>

              {/* Funding progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                    <TrendingUp size={14} className="text-[#88C057]" />
                    {pct}% funded
                  </span>
                  {contract.status === "open" && (
                    <span className="text-[#1B5E55] font-semibold">
                      {remaining.toLocaleString()} USDC remaining
                    </span>
                  )}
                </div>
                <div className="h-2.5 rounded-full bg-[#F2F4F3] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#88C057] to-[#6fa344] transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>
                    {contract.fundedAmountUsdc.toLocaleString()} USDC raised
                  </span>
                  <span>
                    Goal: {contract.totalValueUsdc.toLocaleString()} USDC
                  </span>
                </div>
              </div>

              {/* Action button */}
              {contract.status === "open" && (
                <button className="w-full bg-[#88C057] hover:bg-[#6fa344] text-black font-bold py-4 rounded-xl transition-colors text-base">
                  Buy Contract — {contract.totalValueUsdc.toLocaleString()} USDC
                </button>
              )}
              {contract.status === "funded" && (
                <button
                  disabled
                  className="w-full bg-[#ADC2B5]/30 text-gray-400 font-bold py-4 rounded-xl cursor-not-allowed text-base"
                >
                  Fully Funded
                </button>
              )}
              {contract.status === "redeemable" && (
                <button className="w-full bg-[#1B5E55] hover:bg-[#143f39] text-white font-bold py-4 rounded-xl transition-colors text-base">
                  Redeem NFT Contract
                </button>
              )}
              {contract.status === "redeemed" && (
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-xl cursor-not-allowed text-base"
                >
                  Contract Completed
                </button>
              )}

              {/* Pay with card note */}
              {contract.status === "open" && (
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
                  { label: "Network", value: "Base (Mainnet)" },
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
