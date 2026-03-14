import Link from "next/link";

const benefits = [
  {
    icon: "💰",
    title: "Upfront Capital",
    description:
      "Sell your future harvest before planting season. Get real funds for seeds, tools, irrigation, and labor — without bank loans or exploitative brokers.",
  },
  {
    icon: "🔗",
    title: "No Middlemen",
    description:
      "Connect directly with restaurant owners and specialty buyers. Keep more of your margin. No commodity brokers. No intermediary fees.",
  },
  {
    icon: "🌍",
    title: "Global Reach",
    description:
      "A buyer in Paris or Tokyo can fund your next season. Expand beyond your local market and attract conscious consumers who value your craft.",
  },
  {
    icon: "📋",
    title: "Your Terms",
    description:
      "You set the crop, quantity, delivery date, and price. The smart contract enforces your terms automatically — no paperwork, no ambiguity.",
  },
  {
    icon: "💸",
    title: "Earn Royalties",
    description:
      "Every time your NFT contract is resold on the secondary market before delivery, you earn a 5% royalty automatically — paid to your wallet.",
  },
  {
    icon: "⚡",
    title: "Gasless & Free to Start",
    description:
      "Powered by Coinbase Paymaster on Base — you and your buyers never pay blockchain fees. Creating your first contract costs you nothing.",
  },
];

export default function ForFarmers() {
  return (
    <section id="farmers" className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <div>
            <p
              className="text-[#88C057] text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              For Farmers
            </p>
            <h2
              className="text-[#1B5E55] font-extrabold text-4xl md:text-5xl leading-tight mb-6"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Plant with
              <br />
              <span className="inline-block bg-[#88C057] text-black px-2">
                confidence.
              </span>
            </h2>
            <p className="text-[#6B7280] text-lg leading-relaxed mb-8">
              Stop waiting for harvest to get paid. Precrop Markets turns your
              future yield into immediate capital — so you can invest in your
              land and grow without financial stress.
            </p>
            <Link
              href="/farmer"
              className="inline-block bg-[#1B5E55] hover:bg-[#143f39] text-white font-bold px-8 py-4 rounded-full transition-all duration-200 hover:scale-105 shadow-md"
            >
              Create Your First Contract →
            </Link>
            <p className="text-[#ADC2B5] text-sm mt-4">
              Free to mint · No crypto experience needed
            </p>
          </div>

          {/* Right: benefit cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="bg-[#F2F4F3] rounded-xl p-5 hover:bg-[#1B5E55]/5 transition-colors border border-transparent hover:border-[#ADC2B5]/40"
              >
                <span className="text-2xl mb-3 block">{b.icon}</span>
                <h4
                  className="text-[#1B5E55] font-bold text-sm mb-2"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {b.title}
                </h4>
                <p className="text-[#6B7280] text-sm leading-relaxed">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
