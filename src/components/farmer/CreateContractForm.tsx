"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  Sprout,
  MapPin,
  FileText,
  Zap,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  Wallet,
  Loader2,
} from "lucide-react";
import {
  MARKET_ABI,
  CONTRACT_ADDRESSES,
  contractsReady,
  toUsdcAtoms,
} from "@/lib/web3/contracts";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/* ─── Types ─── */
interface FormData {
  // Step 1 — Crop Details
  cropName: string;
  cropCategory: string;
  description: string;
  gradingStandard: string;
  // Quality Standards
  qsMoisture: string;
  qsTotalDefects: string;
  qsTotalDamaged: string;
  qsForeignMaterial: string;
  qsContrasting: string;
  qsTestWeight: string;
  qsSpecialMetrics: string;
  // Step 2 — Farm Info
  farmName: string;
  farmerName: string;
  farmerEmail: string;
  farmerPhone: string;
  region: string;
  state: string;
  country: string;
  // Step 3 — Contract Terms
  quantityUnits: string;
  unitType: string;
  unitSizeLbs: string;
  pricePerUnitUsdc: string;
  harvestDate: string;
  deliveryDate: string;
  deliveryMethod: string;
  deliveryLocation: string;
  dockage: string;
}

const initialForm: FormData = {
  cropName: "",
  cropCategory: "grain",
  description: "",
  gradingStandard: "",
  qsMoisture: "",
  qsTotalDefects: "",
  qsTotalDamaged: "",
  qsForeignMaterial: "",
  qsContrasting: "",
  qsTestWeight: "",
  qsSpecialMetrics: "",
  farmName: "",
  farmerName: "",
  farmerEmail: "",
  farmerPhone: "",
  region: "",
  state: "",
  country: "USA",
  quantityUnits: "",
  unitType: "Tote Bag",
  unitSizeLbs: "2000",
  pricePerUnitUsdc: "",
  harvestDate: "",
  deliveryDate: "",
  deliveryMethod: "Buyer Provided",
  deliveryLocation: "Pick-up at Seller's Location",
  dockage: "Allowed by percentage above any quality standard",
};

const cropCategories = [
  { value: "grain", label: "🌾 Grain" },
  { value: "vegetable", label: "🥦 Vegetable" },
  { value: "herb", label: "🌿 Herb" },
  { value: "fruit", label: "🍓 Fruit" },
  { value: "legume", label: "🫘 Legume" },
  { value: "specialty", label: "✨ Specialty" },
];

const unitTypes = [
  { value: "Tote Bag", label: "Tote Bag (2,000 lbs)", sizeLbs: "2000" },
  { value: "kg", label: "kg (kilograms)", sizeLbs: "" },
  { value: "lbs", label: "lbs (pounds)", sizeLbs: "" },
  { value: "Bushel", label: "Bushel", sizeLbs: "" },
  { value: "Crate", label: "Crate", sizeLbs: "" },
];

const deliveryMethods = ["Buyer Provided", "Seller Delivered", "Common Carrier"];

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
  const { user, farm } = useAuth();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<`0x${string}` | undefined>();
  const [mintedTokenId, setMintedTokenId] = useState<number>(12);
  const [mintError, setMintError] = useState("");

  // Pre-fill farm fields from profile
  useEffect(() => {
    if (farm) {
      setForm((prev) => ({
        ...prev,
        farmName: farm.farm_name ?? prev.farmName,
        farmerName: farm.contact_name ?? prev.farmerName,
        farmerEmail: farm.email ?? prev.farmerEmail,
        farmerPhone: farm.phone ?? prev.farmerPhone,
        region: farm.region ?? prev.region,
        state: farm.state ?? prev.state,
        country: farm.country ?? prev.country,
      }));
    }
  }, [farm]);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const totalUsdc =
    parseFloat(form.quantityUnits || "0") *
    parseFloat(form.pricePerUnitUsdc || "0");

  const canNext = () => {
    if (step === 1)
      return form.cropName && form.description;
    if (step === 2)
      return form.farmName && form.farmerName && form.state;
    if (step === 3)
      return (
        form.quantityUnits &&
        form.pricePerUnitUsdc &&
        form.deliveryDate
      );
    return true;
  };

  // ── Supabase save ──────────────────────────────────────────────────────────
  const saveContractToSupabase = async (tokenId: number, txHash?: string) => {
    if (!user) return;
    const supabase = createClient();
    const qualityStandards: Record<string, string> = {};
    if (form.qsMoisture)        qualityStandards.moisture = form.qsMoisture;
    if (form.qsTotalDefects)    qualityStandards.totalDefects = form.qsTotalDefects;
    if (form.qsTotalDamaged)    qualityStandards.totalDamaged = form.qsTotalDamaged;
    if (form.qsForeignMaterial) qualityStandards.foreignMaterial = form.qsForeignMaterial;
    if (form.qsContrasting)     qualityStandards.contrasting = form.qsContrasting;
    if (form.qsTestWeight)      qualityStandards.testWeight = form.qsTestWeight;
    if (form.qsSpecialMetrics)  qualityStandards.specialMetrics = form.qsSpecialMetrics;

    await supabase.from("contracts").insert({
      token_id: tokenId,
      farm_id: farm?.id ?? null,
      crop_name: form.cropName,
      crop_category: form.cropCategory,
      description: form.description,
      grading_standard: form.gradingStandard || null,
      quality_standards: Object.keys(qualityStandards).length > 0 ? qualityStandards : null,
      quantity_units: parseFloat(form.quantityUnits),
      unit_type: form.unitType,
      unit_size_lbs: form.unitSizeLbs ? parseFloat(form.unitSizeLbs) : null,
      price_per_unit_usdc: parseFloat(form.pricePerUnitUsdc),
      total_value_usdc: totalUsdc,
      harvest_date: form.harvestDate || null,
      delivery_date: form.deliveryDate,
      delivery_method: form.deliveryMethod,
      delivery_location: form.deliveryLocation,
      dockage: form.dockage || null,
      status: "available",
      placeholder_gradient: "from-[#1B5E55] to-[#88C057]",
      contract_address: txHash ? CONTRACT_ADDRESSES.nft : null,
      minted_at: new Date().toISOString(),
    });
  };

  // ── wagmi mint hook ────────────────────────────────────────────────────────
  const { writeContractAsync: writeMintAndList } = useWriteContract();
  const { isSuccess: mintTxSuccess } =
    useWaitForTransactionReceipt({ hash: mintTxHash });

  // Watch for tx confirmation and save to Supabase
  useEffect(() => {
    if (mintTxSuccess && minting) {
      saveContractToSupabase(mintedTokenId, mintTxHash).finally(() => {
        setMinting(false);
        setMinted(true);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mintTxSuccess]);

  const handleMint = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    setMinting(true);
    setMintError("");

    try {
      const metadata = {
        name: form.cropName,
        description: form.description,
        attributes: [
          { trait_type: "Farm",              value: form.farmName },
          { trait_type: "Farmer",            value: form.farmerName },
          { trait_type: "Category",          value: form.cropCategory },
          { trait_type: "Region",            value: `${form.region}, ${form.state}` },
          { trait_type: "Country",           value: form.country },
          { trait_type: "Quantity",          value: `${form.quantityUnits} ${form.unitType}` },
          { trait_type: "Price per Unit",    value: `${form.pricePerUnitUsdc} USDC/${form.unitType}` },
          { trait_type: "Delivery Date",     value: form.deliveryDate },
          { trait_type: "Delivery Method",   value: form.deliveryMethod },
          { trait_type: "Delivery Location", value: form.deliveryLocation },
          { trait_type: "Grading Standard",  value: form.gradingStandard },
          ...(form.qsMoisture        ? [{ trait_type: "Moisture",         value: form.qsMoisture }]        : []),
          ...(form.qsTotalDefects    ? [{ trait_type: "Total Defects",    value: form.qsTotalDefects }]    : []),
          ...(form.qsTotalDamaged    ? [{ trait_type: "Total Damaged",    value: form.qsTotalDamaged }]    : []),
          ...(form.qsForeignMaterial ? [{ trait_type: "Foreign Material", value: form.qsForeignMaterial }] : []),
          ...(form.qsContrasting     ? [{ trait_type: "Contrasting",      value: form.qsContrasting }]     : []),
          ...(form.qsTestWeight      ? [{ trait_type: "Test Weight",      value: form.qsTestWeight }]      : []),
          ...(form.qsSpecialMetrics  ? [{ trait_type: "Special Metrics",  value: form.qsSpecialMetrics }]  : []),
          ...(form.dockage           ? [{ trait_type: "Dockage",          value: form.dockage }]           : []),
        ],
      };

      let metadataURI = `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;

      if (process.env.NEXT_PUBLIC_PINATA_ENABLED === "true") {
        const res = await fetch("/api/ipfs/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata }),
        });
        if (res.ok) {
          const { uri } = await res.json();
          metadataURI = uri;
        }
      }

      if (!contractsReady) {
        await new Promise((r) => setTimeout(r, 1800));
        const mockTokenId = Math.floor(Math.random() * 1000) + 100;
        setMintedTokenId(mockTokenId);
        await saveContractToSupabase(mockTokenId);
        setMinting(false);
        setMinted(true);
        return;
      }

      const priceAtoms = toUsdcAtoms(totalUsdc);
      const hash = await writeMintAndList({
        address: CONTRACT_ADDRESSES.market,
        abi: MARKET_ABI,
        functionName: "mintAndList",
        args: [metadataURI, priceAtoms],
      });
      setMintTxHash(hash);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Mint failed";
      setMintError(msg.includes("User rejected") ? "Transaction rejected." : msg);
      setMinting(false);
    }
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
            <span className="font-semibold text-[#1B5E55]">#{mintedTokenId}</span>
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
          {mintTxHash && (
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="text-gray-400">TX</span>
              <a
                href={`https://sepolia.basescan.org/tx/${mintTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#88C057] underline text-xs"
              >
                {mintTxHash.slice(0, 10)}…
              </a>
            </div>
          )}
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
                Tell buyers what you&apos;re growing and why it&apos;s special.
              </p>
            </div>

            <Field label="Crop Name *" hint="Include grade — e.g. 'Grain Chickpeas US No. 1'">
              <input
                type="text"
                placeholder="e.g. Grain Hulless Oats US No. 1"
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
                rows={3}
                placeholder="e.g. Hull-less oats grown with intercropping and no pesticides..."
                value={form.description}
                onChange={set("description")}
                className={`${inputClass} resize-none`}
              />
            </Field>

            <Field
              label="Grading Standard"
              hint="e.g. US No. 1, USDA Organic, Non-GMO Project Verified"
            >
              <input
                type="text"
                placeholder="e.g. US No. 1"
                value={form.gradingStandard}
                onChange={set("gradingStandard")}
                className={inputClass}
              />
            </Field>

            {/* Quality Standards */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#333333]">Quality Standards</p>
                <p className="text-xs text-gray-400 mt-0.5">Specific metrics buyers can hold you to at delivery.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Moisture">
                  <input type="text" placeholder="e.g. &lt;14%" value={form.qsMoisture} onChange={set("qsMoisture")} className={inputClass} />
                </Field>
                <Field label="Total Defects">
                  <input type="text" placeholder="e.g. &lt;2%" value={form.qsTotalDefects} onChange={set("qsTotalDefects")} className={inputClass} />
                </Field>
                <Field label="Total Damaged">
                  <input type="text" placeholder="e.g. &lt;2%" value={form.qsTotalDamaged} onChange={set("qsTotalDamaged")} className={inputClass} />
                </Field>
                <Field label="Foreign Material">
                  <input type="text" placeholder="e.g. &lt;0.5%" value={form.qsForeignMaterial} onChange={set("qsForeignMaterial")} className={inputClass} />
                </Field>
                <Field label="Contrasting (variation)">
                  <input type="text" placeholder="e.g. &lt;1%" value={form.qsContrasting} onChange={set("qsContrasting")} className={inputClass} />
                </Field>
                <Field label="Test Weight">
                  <input type="text" placeholder="e.g. &gt;55 lbs." value={form.qsTestWeight} onChange={set("qsTestWeight")} className={inputClass} />
                </Field>
              </div>
              <Field label="Special Metrics" hint="Organic practices, certifications, special processing, etc.">
                <textarea
                  rows={2}
                  placeholder="e.g. Grown with intercropping, no pesticides, and soil conservation practices."
                  value={form.qsSpecialMetrics}
                  onChange={set("qsSpecialMetrics")}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
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
                  placeholder="e.g. Marias River Farms"
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

            <div className="grid grid-cols-2 gap-4">
              <Field label="Email">
                <input
                  type="email"
                  placeholder="contact@yourfarm.com"
                  value={form.farmerEmail}
                  onChange={set("farmerEmail")}
                  className={inputClass}
                />
              </Field>
              <Field label="Phone / Text">
                <input
                  type="tel"
                  placeholder="+1 406-555-0000"
                  value={form.farmerPhone}
                  onChange={set("farmerPhone")}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Region / County" hint="e.g. Chester, Willamette Valley, Finger Lakes">
              <input
                type="text"
                placeholder="e.g. Chester"
                value={form.region}
                onChange={set("region")}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="State / Province *">
                <input
                  type="text"
                  placeholder="e.g. Montana"
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
                Set the quantity, unit, price, and delivery details.
              </p>
            </div>

            {/* Unit type */}
            <Field label="Unit Type *" hint="How is your crop measured and sold?">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {unitTypes.map(({ value, label, sizeLbs }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, unitType: value, unitSizeLbs: sizeLbs }))
                    }
                    className={`py-2 px-3 rounded-xl text-sm border transition-all text-left ${
                      form.unitType === value
                        ? "bg-[#1B5E55] text-white border-[#1B5E55]"
                        : "border-gray-200 text-gray-600 hover:border-[#1B5E55] hover:text-[#1B5E55]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={`Quantity (${form.unitType}s) *`} hint="Number of units you're committing">
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 10"
                  value={form.quantityUnits}
                  onChange={set("quantityUnits")}
                  className={inputClass}
                />
              </Field>
              <Field label={`Price per ${form.unitType} (USDC) *`} hint="You receive this at delivery">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 100"
                  value={form.pricePerUnitUsdc}
                  onChange={set("pricePerUnitUsdc")}
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Live total */}
            {totalUsdc > 0 && (
              <div className="bg-[#88C057]/10 border border-[#88C057]/20 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <span className="text-sm text-[#1B5E55] font-medium">Total Contract Value</span>
                  {form.unitSizeLbs && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(parseFloat(form.quantityUnits || "0") * parseFloat(form.unitSizeLbs)).toLocaleString()} lbs total
                    </p>
                  )}
                </div>
                <span
                  className="text-2xl font-bold text-[#1B5E55]"
                  style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
                >
                  {totalUsdc.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                  <span className="text-base font-normal text-gray-400">USDC</span>
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Expected Harvest Date">
                <input
                  type="date"
                  value={form.harvestDate}
                  onChange={set("harvestDate")}
                  min={new Date().toISOString().split("T")[0]}
                  className={inputClass}
                />
              </Field>
              <Field label="Earliest Delivery Date *">
                <input
                  type="date"
                  value={form.deliveryDate}
                  onChange={set("deliveryDate")}
                  min={form.harvestDate || new Date().toISOString().split("T")[0]}
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Delivery */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-sm font-semibold text-[#333333]">Delivery</p>
              <Field label="Delivery Method">
                <div className="flex flex-wrap gap-2">
                  {deliveryMethods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, deliveryMethod: method }))}
                      className={`py-2 px-4 rounded-xl text-sm border transition-all ${
                        form.deliveryMethod === method
                          ? "bg-[#1B5E55] text-white border-[#1B5E55]"
                          : "border-gray-200 text-gray-600 hover:border-[#1B5E55] hover:text-[#1B5E55]"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Pickup / Delivery Location">
                <input
                  type="text"
                  placeholder="e.g. Pick-up at Seller's Location"
                  value={form.deliveryLocation}
                  onChange={set("deliveryLocation")}
                  className={inputClass}
                />
              </Field>
              <Field label="Dockage" hint="How quality shortfalls are handled">
                <input
                  type="text"
                  placeholder="e.g. Allowed by percentage above any quality standard"
                  value={form.dockage}
                  onChange={set("dockage")}
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

            {[
              {
                title: "Crop Details",
                items: [
                  { label: "Crop", value: form.cropName },
                  { label: "Category", value: form.cropCategory },
                  ...(form.gradingStandard ? [{ label: "Grading", value: form.gradingStandard }] : []),
                  ...(form.qsMoisture ? [{ label: "Moisture", value: form.qsMoisture }] : []),
                  ...(form.qsTotalDefects ? [{ label: "Total Defects", value: form.qsTotalDefects }] : []),
                  ...(form.qsTotalDamaged ? [{ label: "Total Damaged", value: form.qsTotalDamaged }] : []),
                  ...(form.qsForeignMaterial ? [{ label: "Foreign Material", value: form.qsForeignMaterial }] : []),
                  ...(form.qsContrasting ? [{ label: "Contrasting", value: form.qsContrasting }] : []),
                  ...(form.qsTestWeight ? [{ label: "Test Weight", value: form.qsTestWeight }] : []),
                ],
              },
              {
                title: "Farm",
                items: [
                  { label: "Farm", value: form.farmName },
                  { label: "Farmer", value: form.farmerName },
                  { label: "Location", value: [form.region, form.state, form.country].filter(Boolean).join(", ") },
                  ...(form.farmerEmail ? [{ label: "Email", value: form.farmerEmail }] : []),
                  ...(form.farmerPhone ? [{ label: "Phone", value: form.farmerPhone }] : []),
                ],
              },
              {
                title: "Contract Terms",
                items: [
                  { label: "Quantity", value: `${form.quantityUnits} ${form.unitType}${form.unitSizeLbs ? `s (${(parseFloat(form.quantityUnits||"0") * parseFloat(form.unitSizeLbs)).toLocaleString()} lbs)` : ""}` },
                  { label: "Price", value: `${form.pricePerUnitUsdc} USDC/${form.unitType}` },
                  { label: "Total Value", value: `${totalUsdc.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`, highlight: true },
                  ...(form.harvestDate ? [{ label: "Harvest", value: form.harvestDate }] : []),
                  { label: "Delivery", value: form.deliveryDate },
                  { label: "Method", value: form.deliveryMethod },
                  { label: "Location", value: form.deliveryLocation },
                  ...(form.dockage ? [{ label: "Dockage", value: form.dockage }] : []),
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
                      className={`font-medium text-right max-w-[60%] ${
                        highlight ? "text-[#1B5E55] font-bold" : "text-[#333333]"
                      }`}
                    >
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            ))}

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

            {mintError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 text-center">
                {mintError}
              </div>
            )}

            {!isConnected ? (
              <button
                onClick={() => openConnectModal?.()}
                className="w-full bg-[#1B5E55] hover:bg-[#143f39] text-white font-bold py-4 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
              >
                <Wallet size={18} />
                Connect Wallet to Mint
              </button>
            ) : (
              <button
                onClick={handleMint}
                disabled={minting}
                className="w-full bg-[#88C057] hover:bg-[#6fa344] disabled:bg-[#ADC2B5] text-black font-bold py-4 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
              >
                {minting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Minting on Base…
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Mint NFT Contract
                  </>
                )}
              </button>
            )}
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
