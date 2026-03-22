"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

export default function BuyerSettingsPage() {
  const { user, profile, buyerProfile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [buyerType, setBuyerType] = useState("individual");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("USA");

  useEffect(() => {
    if (profile) setFullName(profile.full_name ?? "");
    if (buyerProfile) {
      setCompanyName(buyerProfile.company_name ?? "");
      setBuyerType(buyerProfile.buyer_type ?? "individual");
      setAddress(buyerProfile.address ?? "");
      setCity(buyerProfile.city ?? "");
      setState(buyerProfile.state ?? "");
      setCountry(buyerProfile.country ?? "USA");
    }
  }, [profile, buyerProfile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    setSaved(false);

    const supabase = createClient();

    const [profileRes, buyerRes] = await Promise.all([
      supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id),
      supabase.from("buyer_profiles").upsert({
        id: user.id,
        company_name: companyName,
        buyer_type: buyerType,
        address,
        city,
        state,
        country,
      }),
    ]);

    const err = profileRes.error ?? buyerRes.error;
    if (err) {
      setError(err.message);
    } else {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1B5E55]" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
          Buyer Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Your profile is private and never shared on-chain or with sellers.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-7 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-[#88C057]/10 flex items-center justify-center">
            <ShoppingBag size={18} className="text-[#88C057]" />
          </div>
          <div>
            <p className="font-semibold text-[#1B5E55] text-sm">Buyer Profile</p>
            <p className="text-xs text-gray-400">Private — used for delivery coordination only</p>
          </div>
        </div>

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

        <Field label="Street Address" hint="Used for delivery coordination">
          <input type="text" placeholder="e.g. 123 Main St" value={address} onChange={e => setAddress(e.target.value)} className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <input type="text" placeholder="e.g. Chicago" value={city} onChange={e => setCity(e.target.value)} className={inputClass} />
          </Field>
          <Field label="State">
            <input type="text" placeholder="e.g. Illinois" value={state} onChange={e => setState(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Country">
          <select value={country} onChange={e => setCountry(e.target.value)} className={inputClass}>
            <option>USA</option><option>Canada</option><option>Mexico</option><option>Other</option>
          </select>
        </Field>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || !fullName}
          className="w-full bg-[#1B5E55] hover:bg-[#143f39] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check size={16} /> Saved!</>
          ) : (
            "Save Profile"
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-7 space-y-3">
        <p className="text-sm font-semibold text-[#333333]">Account</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Email</span>
          <span className="font-medium text-[#333333]">{user?.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Role</span>
          <span className="font-medium text-[#88C057]">Buyer</span>
        </div>
      </div>
    </div>
  );
}
