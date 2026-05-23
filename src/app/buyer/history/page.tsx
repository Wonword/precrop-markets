"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Clock, ArrowUpRight, PackageCheck, ShoppingBag, Loader2, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

type HistoryEvent = {
  id: string;
  type: "purchase" | "redeem";
  contractId: string;
  cropName: string;
  farmName: string;
  region: string;
  quantityUnits: number;
  unitType: string;
  amountUsdc: number;
  txHash?: string;
  date: string;
  deliveryAddress?: string;
  imageUrl?: string;
  placeholderGradient: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatUsdc(amount: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function BuyerHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("purchases")
      .select("*, contracts(*, farms(farm_name, region, state))")
      .eq("buyer_id", user.id)
      .order("purchased_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const rows = data as unknown as Array<Record<string, unknown>>;
    const result: HistoryEvent[] = [];

    for (const row of rows) {
      const c = row.contracts as Record<string, unknown> | null;
      const farm = (c?.farms as Record<string, unknown> | null) ?? {};
      const gradient = String(c?.placeholder_gradient ?? "from-[#1B5E55] to-[#88C057]");

      result.push({
        id: `purchase-${row.id}`,
        type: "purchase",
        contractId: String(c?.id ?? row.contract_id ?? ""),
        cropName: String(c?.crop_name ?? "Contract"),
        farmName: String(farm.farm_name ?? "Unknown Farm"),
        region: String(farm.region ?? ""),
        quantityUnits: Number(c?.quantity_units ?? 0),
        unitType: String(c?.unit_type ?? "units"),
        amountUsdc: Number(row.paid_usdc ?? 0),
        txHash: row.tx_hash ? String(row.tx_hash) : undefined,
        date: String(row.purchased_at ?? ""),
        imageUrl: c?.image_url ? String(c.image_url) : undefined,
        placeholderGradient: gradient,
      });

      if (row.redeemed_at) {
        result.push({
          id: `redeem-${row.id}`,
          type: "redeem",
          contractId: String(c?.id ?? row.contract_id ?? ""),
          cropName: String(c?.crop_name ?? "Contract"),
          farmName: String(farm.farm_name ?? "Unknown Farm"),
          region: String(farm.region ?? ""),
          quantityUnits: Number(c?.quantity_units ?? 0),
          unitType: String(c?.unit_type ?? "units"),
          amountUsdc: Number(row.paid_usdc ?? 0),
          txHash: row.redeem_tx_hash ? String(row.redeem_tx_hash) : undefined,
          date: String(row.redeemed_at),
          deliveryAddress: row.delivery_address ? String(row.delivery_address) : undefined,
          imageUrl: c?.image_url ? String(c.image_url) : undefined,
          placeholderGradient: gradient,
        });
      }
    }

    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEvents(result);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchHistory();
  }, [user, authLoading, fetchHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-[#1B5E55]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
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
            Transaction History
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {events.length} event{events.length !== 1 ? "s" : ""}
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

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Clock size={32} className="text-[#ADC2B5] mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No transactions yet.</p>
          <Link
            href="/marketplace"
            className="inline-block mt-4 text-sm font-semibold text-[#1B5E55] hover:underline"
          >
            Browse available contracts →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-4 p-5 hover:bg-[#F8FAF8] transition-colors">
              {/* Icon */}
              <div
                className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  event.type === "purchase"
                    ? "bg-[#1B5E55]/10"
                    : "bg-[#88C057]/15"
                }`}
              >
                {event.type === "purchase" ? (
                  <ShoppingBag size={16} className="text-[#1B5E55]" />
                ) : (
                  <PackageCheck size={16} className="text-[#88C057]" />
                )}
              </div>

              {/* Crop thumbnail */}
              <div className="shrink-0 hidden sm:block">
                {event.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.imageUrl}
                    alt={event.cropName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${event.placeholderGradient}`}
                  />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#1B5E55] text-sm leading-tight">
                      {event.type === "purchase" ? "Purchased" : "Redeemed"}{" "}
                      <span className="font-bold">{event.cropName}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {event.farmName}
                      {event.region ? ` · ${event.region}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#1B5E55]">
                      {formatUsdc(event.amountUsdc)}{" "}
                      <span className="font-normal text-gray-400">USDC</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.date)}</p>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-xs text-gray-500">
                    {event.quantityUnits} {event.unitType}
                  </span>
                  {event.type === "redeem" && event.deliveryAddress && (
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">
                      → {event.deliveryAddress}
                    </span>
                  )}
                  {event.txHash && (
                    <a
                      href={`https://basescan.org/tx/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#1B5E55] hover:underline"
                    >
                      Tx {event.txHash.slice(0, 8)}…
                      <ArrowUpRight size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
