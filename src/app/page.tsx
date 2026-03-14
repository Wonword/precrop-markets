import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ForFarmers from "@/components/landing/ForFarmers";
import ForBuyers from "@/components/landing/ForBuyers";
import Stats from "@/components/landing/Stats";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <ForFarmers />
      <ForBuyers />
      <Stats />
      <CTASection />
      <Footer />
    </main>
  );
}
