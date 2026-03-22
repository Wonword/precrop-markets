import Link from "next/link";
import {
  Sprout,
  Calendar,
  DollarSign,
  PlusCircle,
  ArrowRight,
  Package,
  CheckCircle2,
} from "lucide-react";
import StatusBadge from "@/components/marketplace/StatusBadge";
import { mockContracts } from "@/lib/mockContracts";

// Mock: show first 3 contracts as this farmer's listings
const myContracts = mockContracts.slice(0, 4);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FarmerDashboardPage() {
  const totalValue = myContracts.reduce(
    (sum, c) => sum + c.totalValueUsdc,
    0
  );
  const soldContracts = myContracts.filter(
    (c) => c.status === "sold" || c.status === "redeemable" || c.status === "redeemed"
  );
  const totalEarned = soldContracts.reduce((sum, c) => sum + c.totalValueUsdc, 0);
  const activeContracts = myContracts.filter(
    (c) => c.status === "available" || c.status === "sold"
  ).length;
  const nextDelivery = myContracts
    .filter((c) => c.status !== "redeemed")
    .sort(
      (a, b) =>
        new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
    )[0];

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
            Your Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your crop futures contracts and track your earnings.
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Active Contracts",
            value: activeContracts,
            sub: `of ${myContracts.length} total`,
            icon: <Sprout size={20} className="text-[#1B5E55]" />,
            color: "bg-[#1B5E55]/8",
          },
          {
            label: "Total Earned",
            value: `${(totalEarned / 1000).toFixed(1)}k`,
            sub: "USDC from sold contracts",
            icon: <DollarSign size={20} className="text-[#88C057]" />,
            color: "bg-[#88C057]/10",
          },
          {
            label: "Contracts Sold",
            value: soldContracts.length,
            sub: `of ${myContracts.length} total`,
            icon: <CheckCircle2 size={20} className="text-[#ADC2B5]" />,
            color: "bg-[#ADC2B5]/15",
          },
          {
            label: "Next Delivery",
            value: nextDelivery ? formatDate(nextDelivery.deliveryDate) : "—",
            sub: nextDelivery?.cropName ?? "No pending deliveries",
            icon: <Calendar size={20} className="text-[#1B5E55]" />,
            color: "bg-[#1B5E55]/8",
          },
        ].map(({ label, value, sub, icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3"
          >
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
              {icon}
            </div>
            <div>
              <p
                className="text-2xl font-bold text-[#1B5E55]"
                style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
              >
                {value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* My Contracts */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2
            className="font-bold text-[#1B5E55] text-lg"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            My Contracts
          </h2>
          <Link
            href="/farmer/contracts"
            className="text-sm text-[#1B5E55] font-medium flex items-center gap-1 hover:underline"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>

        <div className="divide-y divide-gray-50">
          {myContracts.map((contract) => (
            <div
              key={contract.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-[#F2F4F3]/50 transition-colors"
            >
              {/* Crop thumbnail */}
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${contract.placeholderGradient} shrink-0 overflow-hidden`}
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
                  <p className="font-semibold text-[#1B5E55] text-sm truncate">
                    {contract.cropName}
                  </p>
                  <StatusBadge status={contract.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Package size={10} />
                    {contract.quantityUnits} {contract.unitType}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    Delivery {formatDate(contract.deliveryDate)}
                  </span>
                </div>
              </div>

              {/* Total value */}
              <div className="text-right shrink-0">
                <p className="font-bold text-[#1B5E55] text-sm">
                  {contract.totalValueUsdc.toLocaleString()} USDC
                </p>
                <p className="text-xs text-gray-400">contract value</p>
              </div>

              <Link
                href={`/marketplace/${contract.id}`}
                className="text-xs font-medium text-[#1B5E55] border border-[#1B5E55]/20 px-3 py-1.5 rounded-full hover:bg-[#1B5E55] hover:text-white transition-all shrink-0"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Getting started CTA */}
      <div className="bg-gradient-to-br from-[#1B5E55] to-[#143f39] rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
          <Sprout size={28} className="text-[#88C057]" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3
            className="text-white font-bold text-xl"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            Ready to list your next harvest?
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Create a micro-futures NFT contract and get funded before you even
            plant. Takes less than 5 minutes.
          </p>
        </div>
        <Link
          href="/farmer/create"
          className="bg-[#88C057] hover:bg-[#6fa344] text-black font-semibold px-6 py-3 rounded-full transition-colors text-sm whitespace-nowrap shrink-0"
        >
          Create Contract →
        </Link>
      </div>
    </div>
  );
}
