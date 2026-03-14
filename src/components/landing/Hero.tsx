import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col">

      {/* ── Layer 1: Farm photo background ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/Precrop-image.jpg')" }}
      />

      {/* ── Layer 2: Teal colour wash — left solid, fades right ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, #1B5E55 0%, #1B5E55 38%, #1B5E55cc 55%, #1B5E5566 72%, #1B5E5522 88%, transparent 100%)",
        }}
      />

      {/* ── Layer 3: Vertical top-to-bottom dark vignette for readability ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #1B5E5599 0%, transparent 40%, transparent 70%, #1B5E5599 100%)",
        }}
      />

      {/* ── Layer 4: Dot texture ── */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #88C057 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 max-w-5xl mx-auto w-full">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#88C057] animate-pulse" />
          Now live on Base — gasless transactions for everyone
        </div>

        {/* Tagline */}
        <p
          className="text-white/80 text-lg md:text-xl font-medium mb-4 tracking-wide uppercase"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Agricultural Micro-Futures
        </p>

        {/* Hero headline */}
        <h1
          className="text-white font-extrabold text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight mb-4"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          FUND THE
          <br />
          <span className="inline-block bg-[#88C057] text-black px-3 py-1 mt-2 skew-x-[-1deg]">
            HARVEST NOW.
          </span>
        </h1>

        {/* Slogan */}
        <p
          className="text-white/85 text-xl md:text-2xl font-light mt-6 mb-4 italic"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Where Transparency Grows.
        </p>

        {/* Subtext */}
        <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          Precrop Markets connects independent farmers with specialty buyers
          through blockchain-backed micro-futures contracts — minted as NFTs,
          redeemed at delivery, no middlemen.
        </p>

        {/* Dual CTA */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/farmer"
            className="bg-[#88C057] hover:bg-[#6fa344] text-black font-bold text-base px-10 py-4 rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-[#88C057]/30 min-w-[180px] text-center"
          >
            I am a Farmer
          </Link>
          <Link
            href="/buyer"
            className="bg-white/15 hover:bg-white/25 text-white font-bold text-base px-10 py-4 rounded-full border border-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105 min-w-[180px] text-center"
          >
            I am a Buyer
          </Link>
        </div>

        {/* Trust line */}
        <p className="text-white/40 text-sm mt-10">
          Powered by{" "}
          <span className="text-white/60 font-medium">Base</span> ·{" "}
          <span className="text-white/60 font-medium">Coinbase Wallet</span> ·{" "}
          <span className="text-white/60 font-medium">USDC</span> — No crypto
          experience needed
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="relative z-10 flex justify-center pb-8">
        <div className="flex flex-col items-center gap-2 text-white/40 text-xs">
          <span>Scroll to explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 80L48 69.3C96 58.7 192 37.3 288 32C384 26.7 480 37.3 576 48C672 58.7 768 69.3 864 64C960 58.7 1056 37.3 1152 32C1248 26.7 1344 37.3 1392 42.7L1440 48V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z"
            fill="#F2F4F3"
          />
        </svg>
      </div>
    </section>
  );
}
