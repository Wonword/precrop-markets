import { DollarSign, TrendingUp, Package, Calendar } from "lucide-react";
import { mockContracts } from "@/lib/mockContracts";

const allContracts = mockContracts;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FarmerEarningsPage() {
  const sold = allContracts.filter(
    (c) => c.status === "sold" || c.status === "redeemable" || c.status === "redeemed"
  );
  const redeemed = allContracts.filter((c) => c.status === "redeemed");
  const available = allContracts.filter((c) => c.status === "available");

  const totalEarned = sold.reduce((s, c) => s + c.totalValueUsdc, 0);
  const pendingValue = available.reduce((s, c) => s + c.totalValueUsdc, 0);
  const totalContracts = allContracts.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-[#ADC2B5] font-medium uppercase tracking-widest mb-1">
          Farmer Portal
        </p>
        <h1
          className="text-3xl font-bold text-[#1B5E55]"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          Earnings
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Summary of your contract revenue and delivery history.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Earned",
            value: `${totalEarned.toLocaleString()} USDC`,
            sub: `from ${sold.length} sold contracts`,
            icon: <DollarSign size={20} className="text-[#88C057]" />,
            bg: "bg-[#88C057]/10",
          },
          {
            label: "Pending Revenue",
            value: `${pendingValue.toLocaleString()} USDC`,
            sub: `${available.length} contracts available`,
            icon: <TrendingUp size={20} className="text-[#1B5E55]" />,
            bg: "bg-[#1B5E55]/8",
          },
          {
            label: "Deliveries Complete",
            value: redeemed.length,
            sub: `of ${totalContracts} total contracts`,
            icon: <Package size={20} className="text-[#ADC2B5]" />,
            bg: "bg-[#ADC2B5]/15",
          },
          {
            label: "Avg. Contract Value",
            value:
              sold.length > 0
                ? `${Math.round(totalEarned / sold.length).toLocaleString()} USDC`
                : "—",
            sub: "per sold contract",
            icon: <Calendar size={20} className="text-[#1B5E55]" />,
            bg: "bg-[#1B5E55]/8",
          },
        ].map(({ label, value, sub, icon, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3"
          >
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              {icon}
            </div>
            <div>
              <p
                className="text-xl font-bold text-[#1B5E55] leading-tight"
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

      {/* Sold contract ledger */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2
            className="font-bold text-[#1B5E55] text-lg"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            Revenue Ledger
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Contracts that have been purchased</p>
        </div>

        {sold.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">
            No sold contracts yet. List your first contract to start earning.
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {sold.map((contract) => (
              <div
                key={contract.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${contract.placeholderGradient} shrink-0`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1B5E55] text-sm">{contract.cropName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {contract.quantityUnits.toLocaleString()} {contract.unitType} · Delivery{" "}
                    {formatDate(contract.deliveryDate)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#88C057] text-sm">
                    +{contract.totalValueUsdc.toLocaleString()} USDC
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{contract.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total row */}
        {sold.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-[#F2F4F3] border-t border-gray-100">
            <p className="text-sm font-semibold text-[#333333]">Total earned</p>
            <p className="font-bold text-[#1B5E55] text-base">
              {totalEarned.toLocaleString()} USDC
            </p>
          </div>
        )}
      </div>

      {/* Note about payouts */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#88C057]/10 flex items-center justify-center shrink-0">
          <DollarSign size={18} className="text-[#88C057]" />
        </div>
        <div>
          <p className="font-semibold text-[#333333] text-sm">About Payouts</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            USDC from contract purchases is held in the smart contract until delivery is
            confirmed. Once a buyer redeems their NFT on-chain, funds are released directly
            to your connected wallet. No middlemen, no waiting periods.
          </p>
        </div>
      </div>
    </div>
  );
}
