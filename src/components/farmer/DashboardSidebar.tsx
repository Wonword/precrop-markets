"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sprout,
  PlusCircle,
  DollarSign,
  Settings,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/farmer", icon: LayoutDashboard },
  { label: "My Contracts", href: "/farmer/contracts", icon: Sprout },
  { label: "Create Contract", href: "/farmer/create", icon: PlusCircle, highlight: true },
  { label: "Earnings", href: "/farmer/earnings", icon: DollarSign },
  { label: "Settings", href: "/farmer/settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen pt-20 pb-8 px-4 shrink-0">
      {/* Logo area */}
      <div className="mb-8 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-green-rectangle.png"
          alt="Precrop Markets"
          className="h-8 w-auto"
        />
        <p className="text-xs text-gray-400 mt-2 font-medium">Farmer Portal</p>
      </div>

      {/* Nav */}
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
                className={active ? "text-white" : highlight ? "text-[#88C057]" : "text-[#ADC2B5] group-hover:text-[#1B5E55]"}
              />
              {label}
              {highlight && !active && (
                <ChevronRight size={13} className="ml-auto text-[#88C057]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to site */}
      <Link
        href="/marketplace"
        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-[#1B5E55] transition-colors mt-4 rounded-lg hover:bg-[#F2F4F3]"
      >
        <ArrowLeft size={13} />
        Back to Marketplace
      </Link>
    </aside>
  );
}
