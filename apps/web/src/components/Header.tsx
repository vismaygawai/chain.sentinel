"use client";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = "Operations Center",
  subtitle = "Real-time on-chain multi-agent intelligence and automated risk containment",
}: HeaderProps) {
  return (
    <div className="border-b-2 border-black bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-block border-2 border-black px-3 py-1 bg-electric text-white font-mono text-[11px] font-black uppercase tracking-widest shadow-hard-sm mb-3">
            Real-Time Defense Matrix
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-black">
            {title}
          </h1>
          <p className="font-serif italic text-lg text-gray-700 mt-1 max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Telemetry pill */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="border-2 border-black p-2 bg-[#f4f4f4] shadow-hard-sm">
            <span className="text-gray-500 block text-[10px]">NETWORK:</span>
            <span className="font-bold">ETHEREUM MAINNET</span>
          </div>
          <div className="border-2 border-black p-2 bg-[#f4f4f4] shadow-hard-sm">
            <span className="text-gray-500 block text-[10px]">PROTOCOLS:</span>
            <span className="font-bold">AAVE V3 / UNISWAP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
