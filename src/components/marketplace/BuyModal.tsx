"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { X, Check, ExternalLink, Loader2, Wallet } from "lucide-react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  MARKET_ABI,
  ERC20_ABI,
  CONTRACT_ADDRESSES,
  contractsReady,
  toUsdcAtoms,
} from "@/lib/web3/contracts";
import { CropContract } from "@/types/contract";
import { createClient } from "@/lib/supabase/client";

interface BuyModalProps {
  contract: CropContract;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "idle" | "approving" | "approved" | "buying" | "success" | "error";

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
      className="text-[#88C057] underline flex items-center gap-1 text-xs"
    >
      View on Basescan <ExternalLink size={11} />
    </a>
  );
}

export default function BuyModal({ contract, onClose, onSuccess }: BuyModalProps) {
  const { address: userAddress, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const priceAtoms = toUsdcAtoms(contract.totalValueUsdc);
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>();
  const [buyTxHash, setBuyTxHash] = useState<`0x${string}` | undefined>();

  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "84532");

  // ── Read USDC allowance ──────────────────────────────────────────────────
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, CONTRACT_ADDRESSES.market] : undefined,
    chainId,
    query: { enabled: isConnected && contractsReady && !!userAddress },
  });

  // ── Read USDC balance ────────────────────────────────────────────────────
  const { data: usdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    chainId,
    query: { enabled: isConnected && contractsReady && !!userAddress },
  });

  const hasEnoughBalance = usdcBalance !== undefined && usdcBalance >= priceAtoms;
  const alreadyApproved = allowance !== undefined && allowance >= priceAtoms;

  // ── Write: approve ───────────────────────────────────────────────────────
  const { writeContractAsync: writeApprove } = useWriteContract();
  const { isLoading: approveLoading, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  // ── Write: buy ───────────────────────────────────────────────────────────
  const { writeContractAsync: writeBuy } = useWriteContract();
  const { isLoading: buyLoading, isSuccess: buySuccess } =
    useWaitForTransactionReceipt({ hash: buyTxHash });

  // When approval confirms → move to buy step
  useEffect(() => {
    if (approveSuccess && step === "approving") {
      refetchAllowance();
      setStep("approved");
    }
  }, [approveSuccess, step, refetchAllowance]);

  // When buy confirms → save to Supabase + success
  useEffect(() => {
    if (buySuccess && step === "buying") {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase.from("purchases").insert({
          contract_id: contract.id,
          buyer_id: user.id,
          paid_usdc: contract.totalValueUsdc,
          tx_hash: buyTxHash ?? null,
        }).then(() => {
          // Also mark contract as sold
          supabase.from("contracts").update({ status: "sold" }).eq("id", contract.id);
        });
      });
      setStep("success");
    }
  }, [buySuccess, step, contract.id, contract.totalValueUsdc, buyTxHash]);

  const handleApprove = async () => {
    try {
      setStep("approving");
      const hash = await writeApprove({
        address: CONTRACT_ADDRESSES.usdc,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.market, priceAtoms],
      });
      setApproveTxHash(hash);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Approval failed";
      setErrorMsg(msg.includes("User rejected") ? "Transaction rejected." : msg);
      setStep("error");
    }
  };

  const handleBuy = async () => {
    try {
      setStep("buying");
      const hash = await writeBuy({
        address: CONTRACT_ADDRESSES.market,
        abi: MARKET_ABI,
        functionName: "buy",
        args: [BigInt(contract.tokenId)],
      });
      setBuyTxHash(hash);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Purchase failed";
      setErrorMsg(msg.includes("User rejected") ? "Transaction rejected." : msg);
      setStep("error");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2
              className="font-bold text-[#1B5E55] text-lg"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              Buy Contract
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{contract.cropName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Price summary */}
          <div className="bg-[#F2F4F3] rounded-xl px-5 py-4 space-y-2 text-sm">
            {[
              { label: "Contract", value: contract.cropName },
              { label: "Quantity", value: `${contract.quantityUnits.toLocaleString()} ${contract.unitType}${contract.unitSizeLbs ? ` (${(contract.quantityUnits * contract.unitSizeLbs).toLocaleString()} lbs)` : ""}` },
              { label: "NFT Token", value: `#${contract.tokenId}` },
              { label: "Network", value: "Base" },
              { label: "Gas Fees", value: "Sponsored by Precrop ✓" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium text-[#333333] text-right">{value}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
              <span className="font-semibold text-[#1B5E55]">Total</span>
              <span className="font-bold text-[#1B5E55] text-base">
                {contract.totalValueUsdc.toLocaleString()} USDC
              </span>
            </div>
          </div>

          {/* Not connected */}
          {!isConnected && (
            <button
              onClick={openConnectModal}
              className="w-full bg-[#1B5E55] hover:bg-[#143f39] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Wallet size={17} />
              Connect Wallet to Buy
            </button>
          )}

          {/* Contracts not deployed yet */}
          {isConnected && !contractsReady && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 text-center">
              Contracts not yet deployed to this network.<br />
              <span className="text-xs text-amber-600">Coming soon on Base.</span>
            </div>
          )}

          {/* Loading balance */}
          {isConnected && contractsReady && usdcBalance === undefined && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              Checking USDC balance…
            </div>
          )}

          {/* Insufficient balance */}
          {isConnected && contractsReady && !hasEnoughBalance && usdcBalance !== undefined && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 text-center">
              Insufficient USDC balance.<br />
              <span className="text-xs">
                You need {contract.totalValueUsdc.toLocaleString()} USDC.
              </span>
            </div>
          )}

          {/* Main flow */}
          {isConnected && contractsReady && hasEnoughBalance && step !== "success" && step !== "error" && (
            <div className="space-y-3">
              {/* Step indicators */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {/* Step 1 — Approve */}
                <div className={`flex items-center gap-1.5 ${alreadyApproved || step === "approved" ? "text-[#88C057]" : step === "approving" ? "text-[#1B5E55]" : "text-gray-400"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${alreadyApproved || step === "approved" ? "bg-[#88C057] text-white" : step === "approving" ? "bg-[#1B5E55] text-white" : "bg-gray-200 text-gray-500"}`}>
                    {alreadyApproved || step === "approved" ? <Check size={11} /> : "1"}
                  </div>
                  Approve USDC
                </div>
                <div className="flex-1 h-px bg-gray-200" />
                {/* Step 2 — Buy */}
                <div className={`flex items-center gap-1.5 ${step === "buying" ? "text-[#1B5E55]" : "text-gray-400"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === "buying" ? "bg-[#1B5E55] text-white" : "bg-gray-200 text-gray-500"}`}>
                    2
                  </div>
                  Confirm Purchase
                </div>
              </div>

              {/* Approve button */}
              {!alreadyApproved && step !== "approved" && (
                <button
                  onClick={handleApprove}
                  disabled={step === "approving" || approveLoading}
                  className="w-full bg-[#1B5E55] hover:bg-[#143f39] disabled:bg-[#ADC2B5] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {(step === "approving" || approveLoading) ? (
                    <><Loader2 size={17} className="animate-spin" /> Approving USDC…</>
                  ) : (
                    <>Approve {contract.totalValueUsdc.toLocaleString()} USDC</>
                  )}
                </button>
              )}
              {approveTxHash && <TxLink hash={approveTxHash} />}

              {/* Buy button */}
              {(alreadyApproved || step === "approved") && (
                <button
                  onClick={handleBuy}
                  disabled={step === "buying" || buyLoading}
                  className="w-full bg-[#88C057] hover:bg-[#6fa344] disabled:bg-[#ADC2B5] text-black font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {(step === "buying" || buyLoading) ? (
                    <><Loader2 size={17} className="animate-spin" /> Confirming on Base…</>
                  ) : (
                    <>Buy Contract — {contract.totalValueUsdc.toLocaleString()} USDC</>
                  )}
                </button>
              )}
              {buyTxHash && <TxLink hash={buyTxHash} />}
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="w-14 h-14 rounded-full bg-[#88C057]/15 flex items-center justify-center">
                <Check size={28} className="text-[#88C057]" />
              </div>
              <div>
                <p className="font-bold text-[#1B5E55] text-lg">Purchase Confirmed!</p>
                <p className="text-sm text-gray-500 mt-1">
                  NFT #{contract.tokenId} is now in your wallet.
                </p>
              </div>
              {buyTxHash && <TxLink hash={buyTxHash} />}
              <button
                onClick={onSuccess}
                className="w-full bg-[#1B5E55] hover:bg-[#143f39] text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-1"
              >
                View My Portfolio
              </button>
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 text-center">
                {errorMsg || "Something went wrong."}
              </div>
              <button
                onClick={() => { setStep("idle"); setErrorMsg(""); }}
                className="w-full border border-[#1B5E55]/20 text-[#1B5E55] font-semibold py-3 rounded-xl hover:bg-[#1B5E55]/5 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
