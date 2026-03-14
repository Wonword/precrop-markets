import Link from "next/link";
import { MapPin, Calendar, Package } from "lucide-react";
import { CropContract } from "@/types/contract";
import StatusBadge from "./StatusBadge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ContractCard({ contract }: { contract: CropContract }) {
  return (
    <Link
      href={`/marketplace/${contract.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Crop image placeholder */}
      <div
        className={`relative h-44 bg-gradient-to-br ${contract.placeholderGradient} flex items-end p-4`}
      >
        <StatusBadge status={contract.status} />
        <span className="absolute top-4 right-4 text-xs font-medium text-white/80 bg-black/25 px-2.5 py-1 rounded-full backdrop-blur-sm">
          #{contract.tokenId}
        </span>
        {/* Subtle grain texture overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMCAwTDQgNE0tMSAxTDEgLTFNMyA1TDUgMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')]" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Category pill */}
        <span className="text-xs font-semibold uppercase tracking-widest text-[#1B5E55]/60">
          {contract.cropCategory}
        </span>

        {/* Title */}
        <h3
          className="font-bold text-[#1B5E55] text-lg leading-tight group-hover:text-[#143f39] transition-colors"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          {contract.cropName}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-[#ADC2B5]" />
            {contract.farmName} · {contract.state}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={11} className="text-[#ADC2B5]" />
            Delivery {formatDate(contract.deliveryDate)}
          </span>
          <span className="flex items-center gap-1">
            <Package size={11} className="text-[#ADC2B5]" />
            {contract.quantityKg.toLocaleString()} kg
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1">
          {contract.description}
        </p>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xl font-bold text-[#1B5E55]">
              {contract.totalValueUsdc.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 ml-1">USDC</span>
            <div className="text-xs text-gray-400">
              {contract.pricePerKgUsdc} USDC/kg
            </div>
          </div>

          {contract.status === "available" ? (
            <button className="bg-[#88C057] hover:bg-[#6fa344] text-black text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
              Buy Contract
            </button>
          ) : contract.status === "redeemable" ? (
            <button className="bg-[#1B5E55] hover:bg-[#143f39] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
              Redeem NFT
            </button>
          ) : (
            <span className="text-xs text-gray-400 font-medium px-4 py-2.5 rounded-full border border-gray-200">
              {contract.status === "sold" ? "Sold" : "Completed"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
