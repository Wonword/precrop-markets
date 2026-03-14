const steps = [
  {
    number: "01",
    emoji: "🌱",
    title: "Farmer Creates a Contract",
    description:
      "An independent farmer mints a micro-futures NFT on Precrop Markets — setting the crop type, quantity, delivery date, and price. The NFT is the contract.",
    detail: "e.g. 50kg of heirloom wheat · Delivery: October 2026",
  },
  {
    number: "02",
    emoji: "💳",
    title: "Buyer Purchases the NFT",
    description:
      "Restaurant owners, specialty grain distributors, or conscious consumers buy the NFT with a credit card or USDC. Funds go directly to the farmer — instantly.",
    detail: "Pay by card → auto-converted to USDC on Base",
  },
  {
    number: "03",
    emoji: "🚜",
    title: "Farmer Plants & Harvests",
    description:
      "With real capital in hand, the farmer purchases seeds, equipment, and labor. The NFT is a live, tradable asset on the secondary market until delivery.",
    detail: "NFT can be resold before delivery date",
  },
  {
    number: "04",
    emoji: "✅",
    title: "Delivery & Redemption",
    description:
      "At harvest, the buyer redeems the NFT by transferring it to the designated redemption address. The smart contract confirms delivery and the contract closes.",
    detail: "NFT is burned · Contract closed · Transaction complete",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#F2F4F3] py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p
            className="text-[#88C057] text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            The Process
          </p>
          <h2
            className="text-[#1B5E55] font-extrabold text-4xl md:text-5xl leading-tight"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Simple as a handshake.
            <br />
            <span className="text-[#333333]">Secure as a blockchain.</span>
          </h2>
          <p className="text-[#6B7280] text-lg mt-4 max-w-xl mx-auto">
            Four steps from seed to delivery — fully transparent, on-chain, and
            gasless for all participants.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative bg-white rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow border border-[#ADC2B5]/30 group"
            >
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-3 w-6 h-px bg-[#ADC2B5] z-10" />
              )}

              {/* Step number */}
              <span
                className="text-[#ADC2B5] text-5xl font-extrabold leading-none block mb-4"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {step.number}
              </span>

              {/* Emoji */}
              <span className="text-3xl mb-3 block">{step.emoji}</span>

              {/* Title */}
              <h3
                className="text-[#1B5E55] font-bold text-lg mb-3 leading-snug group-hover:text-[#143f39] transition-colors"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-[#6B7280] text-sm leading-relaxed mb-4">
                {step.description}
              </p>

              {/* Detail pill */}
              <span className="inline-block text-xs text-[#1B5E55] bg-[#1B5E55]/8 border border-[#1B5E55]/15 px-3 py-1 rounded-full">
                {step.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
