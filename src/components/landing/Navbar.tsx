"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const navLinks = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "For Farmers", href: "#farmers" },
  { label: "For Buyers", href: "#buyers" },
  { label: "How It Works", href: "#how-it-works" },
];

/** Precrop-branded wallet connect button */
function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) return null;

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              className="bg-[#88C057] hover:bg-[#6fa344] text-black text-sm font-semibold px-5 py-2 rounded-full transition-colors"
            >
              Connect Wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
            >
              Wrong Network
            </button>
          );
        }

        return (
          <button
            onClick={openAccountModal}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors border border-white/20"
          >
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

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1B5E55]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Left nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.slice(0, 2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Center logo — plain <img> bypasses Next.js optimizer */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-white-rectangle.png"
            alt="Precrop Markets"
            className="h-9 w-auto"
            style={{ display: "block" }}
          />
        </Link>

        {/* Right nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.slice(2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <WalletButton />
        </nav>

        {/* Mobile: icon logo */}
        <Link href="/" className="md:hidden flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-green-square.png"
            alt="Precrop Markets"
            className="h-8 w-8 rounded-full"
            style={{ display: "block" }}
          />
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white ml-3"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#143f39] border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-white/80 hover:text-white text-base font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2">
            <WalletButton />
          </div>
        </div>
      )}
    </header>
  );
}
