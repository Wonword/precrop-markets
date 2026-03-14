import { ContractStatus } from "@/types/contract";

const config: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  available: {
    label: "Available",
    className: "bg-[#88C057]/15 text-[#4a7a1e] border border-[#88C057]/30",
  },
  sold: {
    label: "Sold",
    className: "bg-[#ADC2B5]/20 text-[#1B5E55] border border-[#ADC2B5]/40",
  },
  redeemable: {
    label: "Ready to Redeem",
    className: "bg-[#1B5E55]/10 text-[#1B5E55] border border-[#1B5E55]/25",
  },
  redeemed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
  },
};

export default function StatusBadge({ status }: { status: ContractStatus }) {
  const { label, className } = config[status];
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}
    >
      {status === "available" && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#88C057] mr-1.5 animate-pulse" />
      )}
      {label}
    </span>
  );
}
