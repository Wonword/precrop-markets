"use client";

import { useState } from "react";
import { PackageCheck, Inbox } from "lucide-react";
import NFTCard from "@/components/buyer/NFTCard";
import RedeemModal from "@/components/buyer/RedeemModal";
import { mockPortfolio, OwnedContract } from "@/lib/mockPortfolio";

export default function RedeemPage() {
  const [redeemTarget, setRedeemTarget] = useState<OwnedContract | null>(null);
  const [redeemedIds, setRedeemedIds] = useState<string[]>([]);

  const redeemable = mockPortfolio
    .filter(
      (o) =>
        o.contract.status === "redeemable" &&
        !redeemedIds.includes(o.contract.id)
    );

  const justRedeemed = mockPortfolio.filter((o) =>
    redeemedIds.includes(o.contract.id)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-[#ADC2B5] font-medium uppercase tracking-widest mb-1">
          Buyer Portal
        </p>
        <h1
          className="text-3xl font-bold text-[#1B5E55]"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          Redeem Contracts
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          These contracts have been harvested and are ready for delivery.
          Redeem your NFT to initiate shipment.
        </p>
      </div>

      {/* How it works banner */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-[#1B5E55] text-sm mb-4 uppercase tracking-widest">
          How Redemption Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Enter Delivery Address",
              desc: "Confirm where you want the crop shipped to.",
            },
            {
              step: "2",
              title: "Sign on Base",
              desc: "Your NFT is burned and the farmer receives payment — gasless via Coinbase Paymaster.",
            },
            {
              step: "3",
              title: "Receive Delivery",
              desc: "The farmer ships your crop to the confirmed address within the agreed window.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1B5E55] text-white text-sm font-bold flex items-center justify-center shrink-0">
                {step}
              </div>
              <div>
                <p className="font-semibold text-[#1B5E55] text-sm">{title}</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Redeemable contracts */}
      {redeemable.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <PackageCheck size={18} className="text-[#88C057]" />
            <h2
              className="font-bold text-[#1B5E55] text-lg"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              Ready to Redeem ({redeemable.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {redeemable.map((owned) => (
              <NFTCard
                key={owned.contract.id}
                owned={owned}
                onRedeem={(id) => {
                  const target = redeemable.find((o) => o.contract.id === id);
                  if (target) setRedeemTarget(target);
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#ADC2B5]/20 flex items-center justify-center">
            <Inbox size={28} className="text-[#ADC2B5]" />
          </div>
          <div>
            <p
              className="text-xl font-bold text-[#1B5E55]"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              {justRedeemed.length > 0
                ? "All contracts redeemed!"
                : "No contracts ready yet"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {justRedeemed.length > 0
                ? "Your farmers have been notified and will coordinate delivery."
                : "Check back here when your contracted crops have been harvested."}
            </p>
          </div>
        </div>
      )}

      {/* Recently redeemed */}
      {justRedeemed.length > 0 && (
        <div>
          <h2
            className="font-bold text-[#1B5E55] text-lg mb-4"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            Just Redeemed ✓
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {justRedeemed.map((owned) => (
              <NFTCard
                key={owned.contract.id}
                owned={{
                  ...owned,
                  contract: { ...owned.contract, status: "redeemed" },
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Redeem modal */}
      {redeemTarget && (
        <RedeemModal
          contract={redeemTarget.contract}
          paidUsdc={redeemTarget.paidUsdc}
          onClose={() => setRedeemTarget(null)}
          onSuccess={() => {
            setRedeemedIds((ids) => [...ids, redeemTarget.contract.id]);
            setRedeemTarget(null);
          }}
        />
      )}
    </div>
  );
}
