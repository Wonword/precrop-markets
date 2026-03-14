import Link from "next/link";

export default function CTASection() {
  return (
    <section className="bg-[#000000] py-24 px-6 relative overflow-hidden">
      {/* Subtle green glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#1B5E55]/40 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[150px] bg-[#88C057]/15 blur-[60px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <p
          className="text-[#88C057] text-sm font-semibold uppercase tracking-widest mb-6"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Get Started Today
        </p>
        <h2
          className="text-white font-extrabold text-4xl md:text-6xl leading-tight mb-6"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          The revolution
          <br />
          <span className="text-[#88C057]">starts with one seed.</span>
        </h2>
        <p className="text-white/60 text-lg mb-12 leading-relaxed">
          Whether you&apos;re a farmer ready to fund your next season, or a buyer
          seeking direct access to the finest specialty crops — your place in
          the future of agriculture starts here.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/farmer"
            className="bg-[#88C057] hover:bg-[#6fa344] text-black font-bold text-base px-10 py-4 rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-[#88C057]/20"
          >
            I&apos;m a Farmer — Start Selling
          </Link>
          <Link
            href="/marketplace"
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-base px-10 py-4 rounded-full border border-white/20 transition-all duration-200 hover:scale-105"
          >
            Browse the Marketplace
          </Link>
        </div>

        <p className="text-white/30 text-sm mt-10">
          Where Transparency Grows. — Precrop Markets
        </p>
      </div>
    </section>
  );
}
