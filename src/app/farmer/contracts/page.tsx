"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Package, Calendar, Filter, Loader2 } from "lucide-react";
import StatusBadge from "@/components/marketplace/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Contract } from "@/types/database";
import type { ContractStatus } from "@/types/contract";

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
  const { farm, loading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContractStatus | "all">("all");

  useEffect(() => {
    if (authLoading) return;
    if (!farm?.id) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("contracts")
      .select("*")
      .eq("farm_id", farm.id)
      .order("minted_at", { ascending: false })
      .then(({ data }) => {
        setContracts((data as Contract[]) ?? []);
        setLoading(false);
      });
  }, [farm, authLoading]);

  const filtered =
    filter === "all" ? contracts : contracts.filter((c) => c.status === filter);

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
            Farmer Portal
          </p>
          <h1
            className="text-3xl font-bold text-[#1B5E55]"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            My Contracts
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {contracts.length} total contract{contracts.length !== 1 ? "s" : ""}
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
                ? contracts.length
                : contracts.filter((c) => c.status === value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Contract list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {contracts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No contracts yet.</p>
            <Link
              href="/farmer/create"
              className="inline-block mt-3 text-sm font-semibold text-[#1B5E55] hover:underline"
            >
              Create your first contract →
            </Link>
          </div>
        ) : filtered.length === 0 ? (
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
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contract.placeholder_gradient ?? "from-[#1B5E55] to-[#88C057]"} shrink-0 overflow-hidden`}
                >
                  {contract.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={contract.image_url}
                      alt={contract.crop_name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#1B5E55] text-sm">
                      {contract.crop_name}
                    </p>
                    <StatusBadge status={contract.status} />
                    {contract.token_id != null && (
                      <span className="text-xs text-gray-300">#{contract.token_id}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 flex-wrap">
                    {contract.quantity_units && (
                      <span className="flex items-center gap-1">
                        <Package size={11} />
                        {Number(contract.quantity_units).toLocaleString()} {contract.unit_type}
                      </span>
                    )}
                    {contract.delivery_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        Delivery {formatDate(contract.delivery_date)}
                      </span>
                    )}
                    {contract.harvest_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        Harvest {formatDate(contract.harvest_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Value */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#1B5E55] text-sm">
                    {Number(contract.total_value_usdc ?? 0).toLocaleString()} USDC
                  </p>
                  {contract.price_per_unit_usdc && contract.unit_type && (
                    <p className="text-xs text-gray-400">
                      {Number(contract.price_per_unit_usdc).toLocaleString()} / {contract.unit_type}
                    </p>
                  )}
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
