"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ChevronDown, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "For Farmers", href: "#farmers" },
  { label: "For Buyers", href: "#buyers" },
  { label: "How It Works", href: "#how-it-works" },
];

function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        if (!ready) return null;
        if (!connected) {
          return (
            <button onClick={openConnectModal} className="bg-[#88C057] hover:bg-[#6fa344] text-black text-sm font-semibold px-5 py-2 rounded-full transition-colors">
              Connect Wallet
            </button>
          );
        }
        if (chain.unsupported) {
          return (
            <button onClick={openChainModal} className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
              Wrong Network
            </button>
          );
        }
        return (
          <button onClick={openAccountModal} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors border border-white/20">
            {chain.hasIcon && chain.iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={chain.iconUrl} alt={chain.name} className="w-4 h-4 rounded-full" />
            )}
            <span className="max-w-[100px] truncate">{account.displayName}</span>
            <span className="text-white/60">{account.displayBalance}</span>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

function UserMenu() {
  const { user, profile, farm, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) {
    return (
      <Link href="/auth/login" className="text-white/80 hover:text-white text-sm font-medium transition-colors border border-white/20 px-4 py-2 rounded-full hover:bg-white/10">
        Sign In
      </Link>
    );
  }

  const initials = (profile?.full_name ?? user.email ?? "U")
    .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const dashboardHref = profile?.role === "farmer" ? "/farmer" : "/buyer";
  const settingsHref = profile?.role === "farmer" ? "/farmer/settings" : "/buyer/settings";
  const displayName = profile?.role === "farmer"
    ? (farm?.farm_name ?? profile.full_name ?? "My Farm")
    : (profile?.full_name ?? user.email ?? "My Account");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-2 rounded-full transition-colors border border-white/20"
      >
        <span className="w-6 h-6 rounded-full bg-[#88C057] flex items-center justify-center text-black text-xs font-bold">
          {initials}
        </span>
        <span className="max-w-[120px] truncate hidden sm:block">{displayName}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-[#1B5E55] uppercase tracking-wider">
              {profile?.role === "farmer" ? "Farmer" : "Buyer"}
            </p>
            <p className="text-sm font-medium text-[#333333] mt-0.5 truncate">{displayName}</p>
          </div>
          <div className="py-1">
            <Link href={dashboardHref} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-[#F2F4F3] hover:text-[#1B5E55] transition-colors">
              <LayoutDashboard size={15} />
              My Dashboard
            </Link>
            <Link href={settingsHref} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-[#F2F4F3] hover:text-[#1B5E55] transition-colors">
              <Settings size={15} />
              Settings
            </Link>
          </div>
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={async () => { setOpen(false); await signOut(); router.push("/"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1B5E55]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.slice(0, 2).map((link) => (
            <Link key={link.href} href={link.href} className="text-white/80 hover:text-white text-sm font-medium transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white-rectangle.png" alt="Precrop Markets" className="h-9 w-auto" style={{ display: "block" }} />
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          {navLinks.slice(2).map((link) => (
            <Link key={link.href} href={link.href} className="text-white/80 hover:text-white text-sm font-medium transition-colors">
              {link.label}
            </Link>
          ))}
          {user && <WalletButton />}
          <UserMenu />
        </nav>

        <Link href="/" className="md:hidden flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-green-square.png" alt="Precrop Markets" className="h-8 w-8 rounded-full" style={{ display: "block" }} />
        </Link>

        <button className="md:hidden text-white ml-3" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#143f39] border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="text-white/80 hover:text-white text-base font-medium transition-colors">
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 mt-2">
            {user && <WalletButton />}
            <UserMenu />
          </div>
        </div>
      )}
    </header>
  );
}
