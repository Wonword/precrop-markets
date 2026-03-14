import Link from "next/link";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { OwnedContract } from "@/lib/mockPortfolio";
import StatusBadge from "@/components/marketplace/StatusBadge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NFTCard({
  owned,
  onRedeem,
}: {
  owned: OwnedContract;
  onRedeem?: (id: string) => void;
}) {
  const { contract, purchasedAt, paidUsdc } = owned;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-shadow">
      {/* NFT image / gradient */}
      <div
        className={`relative h-40 bg-gradient-to-br ${contract.placeholderGradient}`}
      >
        {/* Overlay shimmer on owned NFTs */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Token badge */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={contract.status} />
        </div>
        <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
          NFT #{contract.tokenId}
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-3 left-3 right-3">
          <p
            className="text-white font-bold text-sm leading-tight truncate"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            {contract.cropName}
          </p>
          <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
            <MapPin size={10} />
            {contract.farmName} · {contract.state}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Key info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-gray-400 font-medium">Paid</p>
            <p className="font-bold text-[#1B5E55] mt-0.5">
              {paidUsdc.toLocaleString()}{" "}
              <span className="font-normal text-gray-400">USDC</span>
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">Purchased</p>
            <p className="font-semibold text-[#333333] mt-0.5">
              {formatDate(purchasedAt)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">Quantity</p>
            <p className="font-semibold text-[#333333] mt-0.5">
              {contract.quantityKg.toLocaleString()} kg
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">Delivery</p>
            <p className="font-semibold text-[#333333] mt-0.5 flex items-center gap-1">
              <Calendar size={10} className="text-[#ADC2B5]" />
              {formatDate(contract.deliveryDate)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          {contract.status === "redeemable" && onRedeem && (
            <button
              onClick={() => onRedeem(contract.id)}
              className="flex-1 bg-[#1B5E55] hover:bg-[#143f39] text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
            >
              Redeem NFT →
            </button>
          )}
          {contract.status === "redeemed" && (
            <div className="flex-1 bg-[#88C057]/10 text-[#4a7a1e] text-xs font-bold py-2.5 rounded-xl text-center">
              ✓ Delivery Complete
            </div>
          )}
          {(contract.status === "available" || contract.status === "sold") && (
            <div className="flex-1 bg-[#ADC2B5]/15 text-[#1B5E55]/60 text-xs font-semibold py-2.5 rounded-xl text-center">
              Awaiting Harvest
            </div>
          )}
          <Link
            href={`/marketplace/${contract.id}`}
            className="p-2.5 rounded-xl border border-gray-200 hover:border-[#1B5E55] hover:text-[#1B5E55] text-gray-400 transition-colors"
            title="View listing"
          >
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
