import CreateContractForm from "@/components/farmer/CreateContractForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Contract — Precrop Markets",
  description: "Mint a new micro-futures crop contract as an NFT on Base.",
};

export default function CreateContractPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-sm text-[#ADC2B5] font-medium uppercase tracking-widest mb-1">
          New Listing
        </p>
        <h1
          className="text-3xl font-bold text-[#1B5E55]"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          Create a Crop Contract
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Your contract will be minted as a unique NFT on Base — gasless,
          transparent, and fundable before you plant.
        </p>
      </div>
      <CreateContractForm />
    </div>
  );
}
