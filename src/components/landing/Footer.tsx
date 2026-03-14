import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Marketplace", href: "/marketplace" },
    { label: "For Farmers", href: "#farmers" },
    { label: "For Buyers", href: "#buyers" },
    { label: "How It Works", href: "#how-it-works" },
  ],
  Resources: [
    { label: "What are Micro-Futures?", href: "#" },
    { label: "NFT Contracts Explained", href: "#" },
    { label: "Getting Started Guide", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  Legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Smart Contract Audit", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#143f39] text-white pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-white-rectangle.png"
                alt="Precrop Markets"
                className="h-10 w-auto"
                style={{ display: "block" }}
              />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              Where Transparency Grows.
            </p>
            <p className="text-white/40 text-xs leading-relaxed">
              Agricultural micro-futures as NFTs — connecting independent
              farmers with specialty buyers on Base.
            </p>
            {/* Chain badges */}
            <div className="flex gap-2 mt-5 flex-wrap">
              {["Base", "USDC", "Coinbase"].map((badge) => (
                <span
                  key={badge}
                  className="text-xs text-white/50 border border-white/15 px-2.5 py-1 rounded-full"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4
                className="text-white font-semibold text-sm mb-4 uppercase tracking-wider"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/50 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Precrop Markets. All rights reserved.
          </p>
          <p className="text-white/20 text-xs">
            Built on{" "}
            <span className="text-white/40">Base</span> ·{" "}
            Powered by{" "}
            <span className="text-white/40">Coinbase</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
