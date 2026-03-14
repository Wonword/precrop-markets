"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  PackageCheck,
  Search,
  Clock,
  Settings,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/buyer", icon: LayoutDashboard },
  { label: "My Portfolio", href: "/buyer/portfolio", icon: Wallet },
  { label: "Redeem Contracts", href: "/buyer/redeem", icon: PackageCheck, highlight: true },
  { label: "History", href: "/buyer/history", icon: Clock },
  { label: "Settings", href: "/buyer/settings", icon: Settings },
];

export default function BuyerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen pt-20 pb-8 px-4 shrink-0">
      <div className="mb-8 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-green-rectangle.png"
          alt="Precrop Markets"
          className="h-8 w-auto"
        />
        <p className="text-xs text-gray-400 mt-2 font-medium">Buyer Portal</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ label, href, icon: Icon, highlight }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-[#1B5E55] text-white shadow-sm"
                  : highlight
                  ? "bg-[#88C057]/10 text-[#1B5E55] hover:bg-[#88C057]/20"
                  : "text-gray-600 hover:bg-[#F2F4F3] hover:text-[#1B5E55]"
              }`}
            >
              <Icon
                size={17}
                className={
                  active
                    ? "text-white"
                    : highlight
                    ? "text-[#88C057]"
                    : "text-[#ADC2B5] group-hover:text-[#1B5E55]"
                }
              />
              {label}
              {highlight && !active && (
                <ChevronRight size={13} className="ml-auto text-[#88C057]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Browse CTA */}
      <Link
        href="/marketplace"
        className="flex items-center gap-2 px-3 py-2.5 mt-3 text-sm font-medium text-[#1B5E55] bg-[#1B5E55]/5 hover:bg-[#1B5E55]/10 rounded-xl transition-colors"
      >
        <Search size={15} className="text-[#ADC2B5]" />
        Browse Marketplace
      </Link>

      <Link
        href="/marketplace"
        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-[#1B5E55] transition-colors mt-1 rounded-lg hover:bg-[#F2F4F3]"
      >
        <ArrowLeft size={13} />
        Back to site
      </Link>
    </aside>
  );
}
