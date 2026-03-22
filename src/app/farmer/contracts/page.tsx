"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle, Package, Calendar, Filter } from "lucide-react";
import StatusBadge from "@/components/marketplace/StatusBadge";
import { mockContracts } from "@/lib/mockContracts";
import type { ContractStatus } from "@/types/contract";

// Mock: all contracts belong to this farmer
const allContracts = mockContracts;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_FILTERS: { label: string; value: ContractStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Sold", value: "sold" },
  { label: "Redeemable", value: "redeemable" },
  { label: "Redeemed", value: "redeemed" },
];

export default function FarmerContractsPage() {
  const [filter, setFilter] = useState<ContractStatus | "all">("all");

  const filtered =
    filter === "all" ? allContracts : allContracts.filter((c) => c.status === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-[#ADC2B5] font-medium uppercase tracking-widest mb-1">
            Farmer Portal
          </p>
          <h1
            className="text-3xl font-bold text-[#1B5E55]"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            My Contracts
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {allContracts.length} total contracts
          </p>
        </div>
        <Link
          href="/farmer/create"
          className="inline-flex items-center gap-2 bg-[#88C057] hover:bg-[#6fa344] text-black font-semibold px-5 py-2.5 rounded-full transition-colors text-sm whitespace-nowrap self-start sm:self-auto"
        >
          <PlusCircle size={16} />
          New Contract
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === value
                ? "bg-[#1B5E55] text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-[#1B5E55] hover:text-[#1B5E55]"
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-60">
              {value === "all"
                ? allContracts.length
                : allContracts.filter((c) => c.status === value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Contract list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No contracts with status &quot;{filter}&quot;.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((contract) => (
              <div
                key={contract.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 hover:bg-[#F2F4F3]/50 transition-colors"
              >
                {/* Gradient thumbnail */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contract.placeholderGradient} shrink-0 overflow-hidden`}
                >
                  {contract.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={contract.imageUrl}
                      alt={contract.cropName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#1B5E55] text-sm">
                      {contract.cropName}
                    </p>
                    <StatusBadge status={contract.status} />
                    <span className="text-xs text-gray-300">#{contract.tokenId}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Package size={11} />
                      {contract.quantityUnits.toLocaleString()} {contract.unitType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      Delivery {formatDate(contract.deliveryDate)}
                    </span>
                    {contract.harvestDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        Harvest {formatDate(contract.harvestDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Value */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#1B5E55] text-sm">
                    {contract.totalValueUsdc.toLocaleString()} USDC
                  </p>
                  <p className="text-xs text-gray-400">
                    {contract.pricePerUnitUsdc} / {contract.unitType}
                  </p>
                </div>

                {/* Action */}
                <Link
                  href={`/marketplace/${contract.id}`}
                  className="text-xs font-medium text-[#1B5E55] border border-[#1B5E55]/20 px-3 py-1.5 rounded-full hover:bg-[#1B5E55] hover:text-white transition-all shrink-0"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
