"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { X, MapPin, Check, PackageCheck, Loader2, ExternalLink } from "lucide-react";
import { CropContract } from "@/types/contract";
import { MARKET_ABI, CONTRACT_ADDRESSES, contractsReady } from "@/lib/web3/contracts";

interface RedeemModalProps {
  contract: CropContract;
  paidUsdc: number;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = ["Delivery Details", "Confirm & Sign", "Done"];

function TxLink({ hash }: { hash: `0x${string}` }) {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "84532");
  const base = chainId === 8453
    ? "https://basescan.org/tx/"
    : "https://sepolia.basescan.org/tx/";
  return (
    <a
      href={`${base}${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#88C057] underline flex items-center gap-1 text-xs justify-center"
    >
      View on Basescan <ExternalLink size={11} />
    </a>
  );
}

export default function RedeemModal({
  contract,
  paidUsdc,
  onClose,
  onSuccess,
}: RedeemModalProps) {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("USA");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [redeemTxHash, setRedeemTxHash] = useState<`0x${string}` | undefined>();

  const inputClass =
    "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#1B5E55] focus:ring-1 focus:ring-[#1B5E55]/20 transition placeholder:text-gray-300";

  // ── Write: redeem ──────────────────────────────────────────────────────────
  const { writeContractAsync: writeRedeem } = useWriteContract();
  const { isLoading: redeemLoading, isSuccess: redeemSuccess } =
    useWaitForTransactionReceipt({ hash: redeemTxHash });

  useEffect(() => {
    if (redeemSuccess) {
      setStep(2);
    }
  }, [redeemSuccess]);

  const handleSign = async () => {
    if (!contractsReady) {
      // Demo mode — simulate success without an on-chain tx
      setStep(2);
      return;
    }
    try {
      const hash = await writeRedeem({
        address: CONTRACT_ADDRESSES.market,
        abi: MARKET_ABI,
        functionName: "redeem",
        args: [BigInt(contract.tokenId)],
      });
      setRedeemTxHash(hash);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Redemption failed";
      setErrorMsg(msg.includes("User rejected") ? "Transaction rejected." : msg);
    }
  };

  const isSigning = redeemLoading && !redeemSuccess;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2
              className="font-bold text-[#1B5E55] text-lg"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              Redeem Contract
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{contract.cropName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        {step < 2 && (
          <div className="flex px-6 pt-5 gap-2">
            {steps.slice(0, 2).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i <= step
                      ? "bg-[#1B5E55] text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    i <= step ? "text-[#1B5E55]" : "text-gray-400"
                  }`}
                >
                  {s}
                </span>
                {i < 1 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full ${
                      step > i ? "bg-[#1B5E55]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="px-6 py-5 space-y-4">
          {/* Step 0 — Delivery address */}
          {step === 0 && (
            <>
              <p className="text-sm text-gray-500">
                Where should{" "}
                <span className="font-semibold text-[#1B5E55]">
                  {contract.quantityUnits.toLocaleString()} {contract.unitType}
                </span>{" "}
                of {contract.cropName} be delivered?
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    placeholder="123 Main St"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      placeholder="New York"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      ZIP / Postal *
                    </label>
                    <input
                      type="text"
                      placeholder="10001"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={inputClass}
                  >
                    <option>USA</option>
                    <option>Canada</option>
                    <option>France</option>
                    <option>UK</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Delivery Notes (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Loading dock entrance on south side"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!address || !city || !zip}
                className="w-full bg-[#1B5E55] hover:bg-[#143f39] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-2"
              >
                Continue →
              </button>
            </>
          )}

          {/* Step 1 — Confirm & Sign */}
          {step === 1 && (
            <>
              <p className="text-sm text-gray-500">
                Review the redemption details. Signing will burn your NFT and
                release the funds to the farmer.
              </p>

              {/* Summary */}
              <div className="bg-[#F2F4F3] rounded-xl p-4 space-y-2.5 text-sm">
                {[
                  { label: "Contract", value: contract.cropName },
                  { label: "Quantity", value: `${contract.quantityUnits.toLocaleString()} ${contract.unitType}` },
                  { label: "Value Paid", value: `${paidUsdc.toLocaleString()} USDC` },
                  {
                    label: "Delivery To",
                    value: `${address}, ${city} ${zip}, ${country}`,
                  },
                  { label: "NFT Token", value: `#${contract.tokenId}` },
                  { label: "Gas Fee", value: "Sponsored ✓" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-gray-400 shrink-0">{label}</span>
                    <span className="font-medium text-[#333333] text-right text-xs">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ This action is irreversible. Your NFT will be burned and the
                farmer will be notified to fulfil the delivery.
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 text-center">
                  {errorMsg}
                  <button onClick={() => setErrorMsg("")} className="ml-2 underline">
                    Retry
                  </button>
                </div>
              )}

              <button
                onClick={handleSign}
                disabled={isSigning}
                className="w-full bg-[#88C057] hover:bg-[#6fa344] disabled:bg-[#ADC2B5] text-black font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {isSigning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Confirming on Base…
                  </>
                ) : (
                  "Sign & Redeem NFT"
                )}
              </button>
              {redeemTxHash && !redeemSuccess && <TxLink hash={redeemTxHash} />}
            </>
          )}

          {/* Step 2 — Success */}
          {step === 2 && (
            <div className="flex flex-col items-center text-center gap-5 py-4">
              <div className="w-16 h-16 rounded-full bg-[#88C057]/15 flex items-center justify-center">
                <PackageCheck size={30} className="text-[#88C057]" />
              </div>
              <div>
                <h3
                  className="text-xl font-bold text-[#1B5E55]"
                  style={{
                    fontFamily: "var(--font-space-grotesk, sans-serif)",
                  }}
                >
                  NFT Redeemed!
                </h3>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                  Your contract has been redeemed on Base. The farmer has been
                  notified and will coordinate delivery to:
                </p>
                <p className="text-sm font-semibold text-[#1B5E55] mt-2 flex items-center justify-center gap-1">
                  <MapPin size={13} />
                  {address}, {city} {zip}
                </p>
              </div>
              <div className="bg-[#F2F4F3] rounded-xl px-5 py-3 text-xs space-y-1 w-full text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">TX Status</span>
                  <span className="font-semibold text-[#88C057]">Confirmed ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">NFT #{contract.tokenId}</span>
                  <span className="font-medium text-gray-500">Burned</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Farmer Paid</span>
                  <span className="font-semibold text-[#1B5E55]">
                    {paidUsdc.toLocaleString()} USDC
                  </span>
                </div>
              </div>
              {redeemTxHash && <TxLink hash={redeemTxHash} />}
              <button
                onClick={onSuccess}
                className="w-full bg-[#1B5E55] hover:bg-[#143f39] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Back to Portfolio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
