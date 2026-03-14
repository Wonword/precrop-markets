"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sprout,
  MapPin,
  FileText,
  Zap,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
} from "lucide-react";

/* ─── Types ─── */
interface FormData {
  // Step 1 — Crop Details
  cropName: string;
  cropCategory: string;
  description: string;
  gradingStandard: string;
  // Step 2 — Farm Info
  farmName: string;
  farmerName: string;
  region: string;
  state: string;
  country: string;
  // Step 3 — Contract Terms
  quantityKg: string;
  pricePerKgUsdc: string;
  harvestDate: string;
  deliveryDate: string;
  // Step 4 — Review
}

const initialForm: FormData = {
  cropName: "",
  cropCategory: "grain",
  description: "",
  gradingStandard: "",
  farmName: "",
  farmerName: "",
  region: "",
  state: "",
  country: "USA",
  quantityKg: "",
  pricePerKgUsdc: "",
  harvestDate: "",
  deliveryDate: "",
};

const cropCategories = [
  { value: "grain", label: "🌾 Grain" },
  { value: "vegetable", label: "🥦 Vegetable" },
  { value: "herb", label: "🌿 Herb" },
  { value: "fruit", label: "🍓 Fruit" },
  { value: "legume", label: "🫘 Legume" },
  { value: "specialty", label: "✨ Specialty" },
];

const steps = [
  { id: 1, label: "Crop Details", icon: Sprout },
  { id: 2, label: "Farm Info", icon: MapPin },
  { id: 3, label: "Contract Terms", icon: FileText },
  { id: 4, label: "Review & Mint", icon: Zap },
];

/* ─── Field helper ─── */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#333333]">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#1B5E55] focus:ring-1 focus:ring-[#1B5E55]/20 transition placeholder:text-gray-300";

/* ─── Main component ─── */
export default function CreateContractForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const totalUsdc =
    parseFloat(form.quantityKg || "0") *
    parseFloat(form.pricePerKgUsdc || "0");

  const canNext = () => {
    if (step === 1)
      return form.cropName && form.description && form.gradingStandard;
    if (step === 2)
      return form.farmName && form.farmerName && form.region && form.state;
    if (step === 3)
      return (
        form.quantityKg &&
        form.pricePerKgUsdc &&
        form.harvestDate &&
        form.deliveryDate
      );
    return true;
  };

  const handleMint = async () => {
    setMinting(true);
    // Simulated mint delay (will wire up real smart contract later)
    await new Promise((r) => setTimeout(r, 2500));
    setMinting(false);
    setMinted(true);
  };

  /* ─── Minted success screen ─── */
  if (minted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[#88C057]/15 flex items-center justify-center">
          <Check size={36} className="text-[#88C057]" />
        </div>
        <div>
          <h2
            className="text-3xl font-bold text-[#1B5E55]"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            Contract Minted!
          </h2>
          <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">
            Your micro-futures NFT for{" "}
            <span className="font-semibold text-[#1B5E55]">
              {form.cropName}
            </span>{" "}
            is now live on Base and visible in the marketplace.
          </p>
        </div>
        <div className="bg-[#F2F4F3] rounded-xl px-6 py-4 text-sm text-gray-600 space-y-1 text-left min-w-64">
          <div className="flex justify-between">
            <span className="text-gray-400">Token ID</span>
            <span className="font-semibold text-[#1B5E55]">#9</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Network</span>
            <span className="font-medium">Base</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Value</span>
            <span className="font-semibold text-[#1B5E55]">
              {totalUsdc.toLocaleString()} USDC
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gas</span>
            <span className="font-medium text-[#88C057]">Sponsored ✓</span>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => router.push("/marketplace")}
            className="bg-[#1B5E55] hover:bg-[#143f39] text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
          >
            View in Marketplace
          </button>
          <button
            onClick={() => {
              setForm(initialForm);
              setStep(1);
              setMinted(false);
            }}
            className="border border-[#1B5E55]/20 text-[#1B5E55] font-semibold px-6 py-2.5 rounded-full hover:bg-[#1B5E55]/5 transition-colors text-sm"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center mb-10">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    done
                      ? "bg-[#88C057] text-white"
                      : active
                      ? "bg-[#1B5E55] text-white shadow-lg shadow-[#1B5E55]/20"
                      : "bg-white border-2 border-gray-200 text-gray-400"
                  }`}
                >
                  {done ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block whitespace-nowrap ${
                    active ? "text-[#1B5E55]" : done ? "text-[#88C057]" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded-full ${
                    step > s.id ? "bg-[#88C057]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        {/* ─── Step 1: Crop Details ─── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2
                className="text-xl font-bold text-[#1B5E55]"
                style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
              >
                Crop Details
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Tell buyers what you're growing and why it's special.
              </p>
            </div>

            <Field label="Crop Name *" hint="Be specific — e.g. 'Heritage Red Fife Wheat'">
              <input
                type="text"
                placeholder="e.g. Purple Hull Barley"
                value={form.cropName}
                onChange={set("cropName")}
                className={inputClass}
              />
            </Field>

            <Field label="Category *">
              <div className="grid grid-cols-3 gap-2">
                {cropCategories.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, cropCategory: value }))
                    }
                    className={`py-2 px-3 rounded-xl text-sm border transition-all text-left ${
                      form.cropCategory === value
                        ? "bg-[#1B5E55] text-white border-[#1B5E55]"
                        : "border-gray-200 text-gray-600 hover:border-[#1B5E55] hover:text-[#1B5E55]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label="Description *"
              hint="Describe your variety, growing practices, and what makes it sought-after."
            >
              <textarea
                rows={4}
                placeholder="e.g. Hand-harvested black garlic fermented over 40 days..."
                value={form.description}
                onChange={set("description")}
                className={`${inputClass} resize-none`}
              />
            </Field>

            <Field
              label="Grading Standard *"
              hint="e.g. USDA Organic, Non-GMO Project Verified, GAP Certified"
            >
              <input
                type="text"
                placeholder="e.g. USDA Certified Organic"
                value={form.gradingStandard}
                onChange={set("gradingStandard")}
                className={inputClass}
              />
            </Field>
          </div>
        )}

        {/* ─── Step 2: Farm Info ─── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2
                className="text-xl font-bold text-[#1B5E55]"
                style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
              >
                Farm Information
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Your farm details will be visible on the NFT and in the marketplace.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Farm Name *">
                <input
                  type="text"
                  placeholder="e.g. Sunrise Ridge Farm"
                  value={form.farmName}
                  onChange={set("farmName")}
                  className={inputClass}
                />
              </Field>
              <Field label="Your Name *">
                <input
                  type="text"
                  placeholder="First & last name"
                  value={form.farmerName}
                  onChange={set("farmerName")}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Region / County *" hint="e.g. Willamette Valley, Finger Lakes">
              <input
                type="text"
                placeholder="e.g. Hudson Valley"
                value={form.region}
                onChange={set("region")}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="State / Province *">
                <input
                  type="text"
                  placeholder="e.g. Oregon"
                  value={form.state}
                  onChange={set("state")}
                  className={inputClass}
                />
              </Field>
              <Field label="Country">
                <select
                  value={form.country}
                  onChange={set("country")}
                  className={inputClass}
                >
                  <option>USA</option>
                  <option>Canada</option>
                  <option>Mexico</option>
                  <option>France</option>
                  <option>Other</option>
                </select>
              </Field>
            </div>

            <div className="flex items-start gap-2 bg-[#1B5E55]/5 rounded-xl p-4">
              <Info size={15} className="text-[#1B5E55] mt-0.5 shrink-0" />
              <p className="text-xs text-[#1B5E55]/70 leading-relaxed">
                Your farm information is stored on-chain as part of the NFT
                metadata and will be publicly visible to all buyers.
              </p>
            </div>
          </div>
        )}

        {/* ─── Step 3: Contract Terms ─── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2
                className="text-xl font-bold text-[#1B5E55]"
                style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
              >
                Contract Terms
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Set the quantity, price, and key dates for your contract.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Quantity (kg) *" hint="Total harvest you're committing to">
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={form.quantityKg}
                  onChange={set("quantityKg")}
                  className={inputClass}
                />
              </Field>
              <Field label="Price per kg (USDC) *" hint="You receive this at delivery">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 2.50"
                  value={form.pricePerKgUsdc}
                  onChange={set("pricePerKgUsdc")}
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Live total */}
            {totalUsdc > 0 && (
              <div className="bg-[#88C057]/10 border border-[#88C057]/20 rounded-xl px-5 py-4 flex items-center justify-between">
                <span className="text-sm text-[#1B5E55] font-medium">
                  Total Contract Value
                </span>
                <span
                  className="text-2xl font-bold text-[#1B5E55]"
                  style={{
                    fontFamily: "var(--font-space-grotesk, sans-serif)",
                  }}
                >
                  {totalUsdc.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-base font-normal text-gray-400">
                    USDC
                  </span>
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Expected Harvest Date *">
                <input
                  type="date"
                  value={form.harvestDate}
                  onChange={set("harvestDate")}
                  min={new Date().toISOString().split("T")[0]}
                  className={inputClass}
                />
              </Field>
              <Field label="Delivery Date *" hint="When buyers receive the crop">
                <input
                  type="date"
                  value={form.deliveryDate}
                  onChange={set("deliveryDate")}
                  min={form.harvestDate || new Date().toISOString().split("T")[0]}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex items-start gap-2 bg-[#1B5E55]/5 rounded-xl p-4">
              <Info size={15} className="text-[#1B5E55] mt-0.5 shrink-0" />
              <p className="text-xs text-[#1B5E55]/70 leading-relaxed">
                A 2.5% platform fee applies at redemption. Funds are held in
                escrow on Base until the delivery NFT is redeemed by the buyer.
              </p>
            </div>
          </div>
        )}

        {/* ─── Step 4: Review & Mint ─── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2
                className="text-xl font-bold text-[#1B5E55]"
                style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
              >
                Review & Mint NFT
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Check your details before minting to Base. This cannot be
                changed after minting.
              </p>
            </div>

            {/* Summary cards */}
            {[
              {
                title: "Crop Details",
                items: [
                  { label: "Crop", value: form.cropName },
                  { label: "Category", value: form.cropCategory },
                  { label: "Grading", value: form.gradingStandard },
                ],
              },
              {
                title: "Farm",
                items: [
                  { label: "Farm", value: form.farmName },
                  { label: "Farmer", value: form.farmerName },
                  {
                    label: "Location",
                    value: `${form.region}, ${form.state}, ${form.country}`,
                  },
                ],
              },
              {
                title: "Contract Terms",
                items: [
                  { label: "Quantity", value: `${form.quantityKg} kg` },
                  {
                    label: "Price",
                    value: `${form.pricePerKgUsdc} USDC/kg`,
                  },
                  {
                    label: "Total Value",
                    value: `${totalUsdc.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`,
                    highlight: true,
                  },
                  { label: "Harvest", value: form.harvestDate },
                  { label: "Delivery", value: form.deliveryDate },
                ],
              },
            ].map(({ title, items }) => (
              <div key={title} className="bg-[#F2F4F3] rounded-xl p-5 space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {title}
                </p>
                {items.map(({ label, value, highlight }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span
                      className={`font-medium ${
                        highlight ? "text-[#1B5E55] font-bold" : "text-[#333333]"
                      }`}
                    >
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* Mint details */}
            <div className="border border-[#1B5E55]/15 rounded-xl p-5 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#1B5E55]/50">
                On-Chain Details
              </p>
              {[
                { label: "Network", value: "Base (Mainnet)" },
                { label: "Token Standard", value: "ERC-721" },
                { label: "Gas Fees", value: "Sponsored by Precrop ✓" },
                { label: "Platform Fee", value: "2.5% at redemption" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-[#333333]">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleMint}
              disabled={minting}
              className="w-full bg-[#88C057] hover:bg-[#6fa344] disabled:bg-[#ADC2B5] text-black font-bold py-4 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
            >
              {minting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Minting on Base…
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Mint NFT Contract
                </>
              )}
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#1B5E55] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 bg-[#1B5E55] hover:bg-[#143f39] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
