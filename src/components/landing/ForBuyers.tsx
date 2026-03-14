import Link from "next/link";

const benefits = [
  {
    icon: "🥩",
    title: "Restaurant Owners",
    description:
      "Lock in specialty ingredients at today's prices. Secure exclusive varieties before they're gone and build direct relationships with the farmers behind your menu.",
  },
  {
    icon: "🌾",
    title: "Specialty Grain Distributors",
    description:
      "Source heritage grains, ancient varieties, and certified organic crops directly from the farm — with full provenance embedded in the NFT metadata.",
  },
  {
    icon: "🛒",
    title: "Conscious Consumers",
    description:
      "Support independent farmers before they plant. Know exactly where your food comes from, who grew it, and how it was grown — on-chain transparency.",
  },
];

const features = [
  { label: "Pay by credit card", icon: "💳" },
  { label: "Tradeable before delivery", icon: "🔄" },
  { label: "Full provenance on-chain", icon: "🔍" },
  { label: "USDC settlement", icon: "🪙" },
  { label: "No crypto wallet needed", icon: "📱" },
  { label: "Gasless transactions", icon: "⚡" },
];

export default function ForBuyers() {
  return (
    <section id="buyers" className="bg-[#1B5E55] py-24 px-6 relative overflow-hidden">
      {/* Background dots */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle, #88C057 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p
            className="text-[#88C057] text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            For Buyers
          </p>
          <h2
            className="text-white font-extrabold text-4xl md:text-5xl leading-tight mb-4"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Know your food
            <br />
            <span className="inline-block bg-[#88C057] text-black px-2 mt-1">
              before it&apos;s planted.
            </span>
          </h2>
          <p className="text-white/65 text-lg max-w-xl mx-auto">
            Purchase micro-futures contracts from farmers you trust. Lock in
            prices, guarantee supply, and support sustainable agriculture — all
            with a credit card.
          </p>
        </div>

        {/* Buyer type cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="bg-white/10 border border-white/15 rounded-2xl p-7 hover:bg-white/15 transition-colors backdrop-blur-sm"
            >
              <span className="text-4xl mb-4 block">{b.icon}</span>
              <h3
                className="text-white font-bold text-lg mb-3"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {b.title}
              </h3>
              <p className="text-white/65 text-sm leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {features.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-2 bg-white/10 border border-white/15 text-white/80 text-sm px-4 py-2 rounded-full"
            >
              <span>{f.icon}</span>
              {f.label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/marketplace"
            className="inline-block bg-[#88C057] hover:bg-[#6fa344] text-black font-bold px-10 py-4 rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-[#88C057]/20"
          >
            Browse the Marketplace →
          </Link>
        </div>
      </div>
    </section>
  );
}
