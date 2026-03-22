"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2, Check, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-[#88C057]/15 flex items-center justify-center">
          <Check size={28} className="text-[#88C057]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#1B5E55]" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
            Check your email
          </h2>
          <p className="text-gray-500 text-sm mt-2 max-w-xs">
            We sent a magic link to <span className="font-semibold text-[#1B5E55]">{email}</span>. Click it to sign in — no password needed.
          </p>
        </div>
        <button
          onClick={() => setSent(false)}
          className="text-sm text-[#1B5E55] hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1B5E55]" style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
          Sign in to Precrop
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Enter your email and we&apos;ll send you a magic link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#1B5E55] focus:ring-1 focus:ring-[#1B5E55]/20 transition"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-[#1B5E55] hover:bg-[#143f39] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
          {loading ? "Sending…" : "Send Magic Link"}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">
        By signing in you agree to our{" "}
        <Link href="/" className="text-[#1B5E55] hover:underline">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/" className="text-[#1B5E55] hover:underline">Privacy Policy</Link>.
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F2F4F3] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-10 text-sm text-[#1B5E55] font-medium hover:text-[#143f39] group">
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Precrop
      </Link>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-green-square.png" alt="Precrop" className="w-14 h-14 rounded-2xl mb-8 shadow-sm" />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
