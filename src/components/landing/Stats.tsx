const stats = [
  {
    value: "37%",
    label: "Lower transaction costs",
    sub: "vs. traditional commodity brokerage",
  },
  {
    value: "40%",
    label: "More financial transparency",
    sub: "on-chain vs. paper contracts",
  },
  {
    value: "31%",
    label: "Faster capital disbursement",
    sub: "smart contracts vs. traditional loans",
  },
  {
    value: "$16T",
    label: "Tokenized assets by 2030",
    sub: "projected global RWA market",
  },
];

export default function Stats() {
  return (
    <section className="bg-[#F2F4F3] py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p
            className="text-[#88C057] text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            The Research
          </p>
          <h2
            className="text-[#1B5E55] font-extrabold text-3xl md:text-4xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            The numbers don&apos;t lie.
          </h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 text-center shadow-sm border border-[#ADC2B5]/25 hover:border-[#1B5E55]/20 transition-colors"
            >
              <p
                className="text-[#1B5E55] font-extrabold text-4xl md:text-5xl mb-2"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {stat.value}
              </p>
              <p className="text-[#333333] font-semibold text-sm mb-1">
                {stat.label}
              </p>
              <p className="text-[#ADC2B5] text-xs">{stat.sub}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[#ADC2B5] text-xs mt-8">
          Sources: Academic research on RWA tokenization &amp; blockchain agricultural finance (2024–2025)
        </p>
      </div>
    </section>
  );
}
