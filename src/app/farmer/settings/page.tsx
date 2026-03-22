"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, Sprout } from "lucide-react";
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

export default function FarmerSettingsPage() {
  const { user, farm, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [farmName, setFarmName] = useState("");
  const [contactName, setContactName] = useState("");
  const [region, setRegion] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("USA");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Pre-fill from existing farm data
  useEffect(() => {
    if (farm) {
      setFarmName(farm.farm_name ?? "");
      setContactName(farm.contact_name ?? "");
      setRegion(farm.region ?? "");
      setState(farm.state ?? "");
      setCountry(farm.country ?? "USA");
      setEmail(farm.email ?? "");
      setPhone(farm.phone ?? "");
      setBio(farm.bio ?? "");
    }
  }, [farm]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    setSaved(false);

    const supabase = createClient();
    const { error: err } = await supabase
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
          Farm Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          This information appears on all your contracts and is publicly visible to buyers.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-7 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-[#1B5E55]/10 flex items-center justify-center">
            <Sprout size={18} className="text-[#1B5E55]" />
          </div>
          <div>
            <p className="font-semibold text-[#1B5E55] text-sm">Farm Profile</p>
            <p className="text-xs text-gray-400">Shown publicly on every contract you list</p>
          </div>
        </div>

        <Field label="Farm Name *">
          <input type="text" placeholder="e.g. Marias River Farms" value={farmName} onChange={e => setFarmName(e.target.value)} className={inputClass} />
        </Field>

        <Field label="Contact Name *">
          <input type="text" placeholder="First & last name" value={contactName} onChange={e => setContactName(e.target.value)} className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Region / County" hint="e.g. Chester, Finger Lakes">
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact Email" hint="Visible to buyers on contract pages">
            <input type="email" placeholder="contact@yourfarm.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Phone / Text" hint="Visible to buyers on contract pages">
            <input type="tel" placeholder="+1 406-555-0000" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Farm Bio" hint="Tell buyers about your farm, practices, and story.">
          <textarea
            rows={4}
            placeholder="e.g. Family farm on Montana's Hi-Line, growing specialty grains with no pesticides since 2010."
            value={bio}
            onChange={e => setBio(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </Field>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || !farmName || !contactName || !state}
          className="w-full bg-[#1B5E55] hover:bg-[#143f39] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check size={16} /> Saved!</>
          ) : (
            "Save Farm Profile"
          )}
        </button>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-7 space-y-3">
        <p className="text-sm font-semibold text-[#333333]">Account</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Email</span>
          <span className="font-medium text-[#333333]">{user?.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Role</span>
          <span className="font-medium text-[#1B5E55]">Farmer</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Reputation Score</span>
          <span className="font-medium text-[#333333]">{farm?.reputation_score ?? 0} / 100</span>
        </div>
      </div>
    </div>
  );
}
