"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BuyModal from "./BuyModal";
import { CropContract } from "@/types/contract";

interface BuyPanelProps {
  contract: CropContract;
}

export default function BuyPanel({ contract }: BuyPanelProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {contract.status === "available" && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-[#88C057] hover:bg-[#6fa344] text-black font-bold py-4 rounded-xl transition-colors text-base"
        >
          Buy Contract — {contract.totalValueUsdc.toLocaleString()} USDC
        </button>
      )}
      {contract.status === "sold" && (
        <button
          disabled
          className="w-full bg-[#ADC2B5]/30 text-gray-400 font-bold py-4 rounded-xl cursor-not-allowed text-base"
        >
          Sold
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

      {showModal && (
        <BuyModal
          contract={contract}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            router.push("/buyer");
          }}
        />
      )}
    </>
  );
}
