import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chain Sentinel | Autonomous DeFi Security & Threat Matrix",
  description: "Real-time on-chain multi-agent defense matrix for DeFi treasuries, liquidity pools, and smart contracts.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
