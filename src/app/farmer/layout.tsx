import type { Metadata } from "next";
import DashboardSidebar from "@/components/farmer/DashboardSidebar";
import Navbar from "@/components/landing/Navbar";

export const metadata: Metadata = {
  title: "Farmer Dashboard — Precrop Markets",
  description: "Manage your crop micro-futures contracts on Precrop Markets.",
};

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F2F4F3]">
      {/* Shared top navbar */}
      <Navbar />

      <div className="flex pt-16">
        {/* Desktop sidebar */}
        <DashboardSidebar />

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
