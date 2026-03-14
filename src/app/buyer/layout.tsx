import type { Metadata } from "next";
import BuyerSidebar from "@/components/buyer/BuyerSidebar";
import Navbar from "@/components/landing/Navbar";

export const metadata: Metadata = {
  title: "Buyer Dashboard — Precrop Markets",
  description: "Manage your crop futures NFT portfolio on Precrop Markets.",
};

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F2F4F3]">
      <Navbar />
      <div className="flex pt-16">
        <BuyerSidebar />
        <main className="flex-1 min-w-0 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
