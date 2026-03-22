"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sprout, ShoppingBag, Loader2, Check, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

const inputClass =
  "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#1B5E55] focus:ring-1 focus:ring-[#1B5E55]/20 transition placeholder:text-gray-300";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#333333]">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  );
}

function OnboardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [step, setStep] = useState<"role" | "profile">("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Farmer fields
  const [farmName, setFarmName] = useState("");
  const [contactName, setContactName] = useState("");
  const [region, setRegion] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("USA");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Buyer fields
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [buyerType, setBuyerType] = useState("individual");
  const [city, setCity] = useState("");
  const [buyerState, setBuyerState] = useState("");
  const [buyerCountry, setBuyerCountry] = useState("USA");

  const handleRoleSelect = (r: UserRole) => {
    setRole(r);
    setStep("profile");
  };

  const handleSave = async () => {
    if (!role) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired. Please sign in again."); setSaving(false); return; }

    // Update profile role + onboarded
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role, onboarded: true, full_name: role === "farmer" ? contactName : fullName, email: user.email })
      .eq("id", user.id);

    if (profileError) { setError(profileError.message); setSaving(false); return; }

    if (role === "farmer") {
      const { error: farmError } = await supabase
        .from("farms")
        .upsert({
          user_id: user.id,
          farm_name: farmName,
          contact_name: contactName,
          region,
          state,
          country,
          email,
          phone,
          bio,
        });
      if (farmError) { setError(farmError.message); setSaving(false); return; }
      router.push(next ?? "/farmer");
    } else {
      const { error: buyerError } = await supabase
        .from("buyer_profiles")
        .upsert({
          id: user.id,
          company_name: companyName,
          buyer_type: buyerType,
          city,
          state: buyerState,
          country: buyerCountry,
        });
      if (buyerError) { setError(buyerError.message); setSaving(false); return; }
      router.push(next ?? "/buyer");
    }
  };

  if (step === "role") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1B5E55]" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
            Welcome to Precrop
          </h1>
          <p className="text-gray-500 text-sm mt-2">How will you be using the platform?</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleRoleSelect("farmer")}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200 hover:border-[#1B5E55] hover:bg-[#1B5E55]/5 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-[#1B5E55]/10 flex items-center justify-center group-hover:bg-[#1B5E55]/20 transition-colors">
              <Sprout size={24} className="text-[#1B5E55]" />
            </div>
            <div className="text-center">
              <p className="font-bold text-[#1B5E55]">I&apos;m a Farmer</p>
              <p className="text-xs text-gray-400 mt-1">Create and list crop contracts</p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("buyer")}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200 hover:border-[#88C057] hover:bg-[#88C057]/5 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-[#88C057]/10 flex items-center justify-center group-hover:bg-[#88C057]/20 transition-colors">
              <ShoppingBag size={24} className="text-[#88C057]" />
            </div>
            <div className="text-center">
              <p className="font-bold text-[#333333]">I&apos;m a Buyer</p>
              <p className="text-xs text-gray-400 mt-1">Browse and purchase contracts</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#1B5E55]/50 mb-3">
          {role === "farmer" ? <Sprout size={12} /> : <ShoppingBag size={12} />}
          {role === "farmer" ? "Farmer Profile" : "Buyer Profile"}
        </div>
        <h1 className="text-2xl font-bold text-[#1B5E55]" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
          {role === "farmer" ? "Set up your farm" : "Set up your profile"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {role === "farmer"
            ? "This info will appear on all your contracts."
            : "This info is private and never shared on-chain."}
        </p>
      </div>

      <div className="space-y-4">
        {role === "farmer" ? (
          <>
            <Field label="Farm Name *">
              <input type="text" placeholder="e.g. Marias River Farms" value={farmName} onChange={e => setFarmName(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Your Name *">
              <input type="text" placeholder="First & last name" value={contactName} onChange={e => setContactName(e.target.value)} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Region / County">
                <input type="text" placeholder="e.g. Chester" value={region} onChange={e => setRegion(e.target.value)} className={inputClass} />
              </Field>
              <Field label="State *">
                <input type="text" placeholder="e.g. Montana" value={state} onChange={e => setState(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label="Country">
              <select value={country} onChange={e => setCountry(e.target.value)} className={inputClass}>
                <option>USA</option><option>Canada</option><option>Mexico</option><option>Other</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <input type="email" placeholder="contact@yourfarm.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Phone">
                <input type="tel" placeholder="+1 406-555-0000" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label="Bio" hint="Tell buyers about your farm and practices.">
              <textarea rows={3} placeholder="e.g. Family farm on the Hi-Line, growing specialty grains with no pesticides since 2010." value={bio} onChange={e => setBio(e.target.value)} className={`${inputClass} resize-none`} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Full Name *">
              <input type="text" placeholder="First & last name" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Company / Organization">
              <input type="text" placeholder="Optional" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Buyer Type">
              <select value={buyerType} onChange={e => setBuyerType(e.target.value)} className={inputClass}>
                <option value="individual">Individual</option>
                <option value="restaurant">Restaurant / Food Service</option>
                <option value="distributor">Distributor / Wholesaler</option>
                <option value="retailer">Retailer / Grocery</option>
                <option value="processor">Food Processor / Manufacturer</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <input type="text" placeholder="e.g. Chicago" value={city} onChange={e => setCity(e.target.value)} className={inputClass} />
              </Field>
              <Field label="State">
                <input type="text" placeholder="e.g. Illinois" value={buyerState} onChange={e => setBuyerState(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label="Country">
              <select value={buyerCountry} onChange={e => setBuyerCountry(e.target.value)} className={inputClass}>
                <option>USA</option><option>Canada</option><option>Mexico</option><option>Other</option>
              </select>
            </Field>
          </>
        )}

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setStep("role")}
            className="text-sm font-medium text-gray-500 hover:text-[#1B5E55] transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (role === "farmer" ? !farmName || !contactName || !state : !fullName)}
            className="flex-1 bg-[#1B5E55] hover:bg-[#143f39] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving…</>
            ) : (
              <>Save & Continue <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <div className="min-h-screen bg-[#F2F4F3] flex flex-col items-center justify-center px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-green-square.png" alt="Precrop" className="w-14 h-14 rounded-2xl mb-8 shadow-sm" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
        <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-[#1B5E55]" /></div>}>
          <OnboardForm />
        </Suspense>
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        <Check size={12} className="text-[#88C057]" />
        Your info is securely stored and never sold.
      </div>
    </div>
  );
}
