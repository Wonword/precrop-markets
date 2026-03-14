import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";

// A dummy placeholder keeps RainbowKit happy at build/SSR time.
// Replace with your real WalletConnect Cloud project ID in .env.local
// (free at https://cloud.walletconnect.com). Without a real ID,
// Coinbase Wallet and MetaMask will still work — only WalletConnect won't.
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000";

export const wagmiConfig = getDefaultConfig({
  appName: "Precrop Markets",
  projectId: walletConnectProjectId,
  chains: [base, baseSepolia],
  ssr: true,
});
