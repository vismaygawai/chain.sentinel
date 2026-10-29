"use client";

import { formatCurrency } from "@/lib/api";

interface Position {
  token: string;
  balance: number;
  usdValue: number;
}

interface AllocationChartProps {
  positions: Position[];
  totalUsdValue: number;
}

const TOKEN_COLORS: Record<string, string> = {
  ETH: "bg-electric text-white",
  WETH: "bg-electric text-white",
  USDT: "bg-black text-white",
  USDC: "bg-[#0052ff] text-white",
  DAI: "bg-[#f5ac37] text-black",
  WBTC: "bg-[#f7931a] text-black",
};

export default function AllocationChart({ positions, totalUsdValue }: AllocationChartProps) {
  const hasPositions = positions && positions.length > 0 && totalUsdValue > 0;

  return (
    <div className="border-2 border-black p-6 bg-white shadow-hard flex flex-col justify-between h-full space-y-6">
      <div>
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <h3 className="font-display text-lg font-black uppercase tracking-tight">
              Treasury Asset Allocation
            </h3>
            <p className="font-serif italic text-xs text-gray-600">
              On-chain reserve diversification breakdown
            </p>
          </div>
          <span className="font-mono text-xs bg-[#f4f4f4] border border-black px-2.5 py-1 font-bold">
            {hasPositions ? `${positions.length} ASSETS RECORDED` : "AWAITING TELEMETRY"}
          </span>
        </div>

        {hasPositions ? (
          <>
            {/* Stacked Proportional Bar */}
            <div className="w-full h-8 border-2 border-black flex overflow-hidden shadow-hard-sm mt-5">
              {positions.map((pos, idx) => {
                const rawPct = totalUsdValue > 0 ? (pos.usdValue / totalUsdValue) * 100 : 0;
                const colorClass = TOKEN_COLORS[pos.token] || "bg-gray-400 text-black";
                return (
                  <div
                    key={`${pos.token}-${idx}`}
                    style={{ flexGrow: Math.max(1, pos.usdValue), minWidth: pos.usdValue > 0 ? '6px' : '0px' }}
                    title={`${pos.token}: ${rawPct.toFixed(1)}% (${formatCurrency(pos.usdValue)})`}
                    className={`${colorClass} h-full border-r-2 last:border-r-0 border-black flex items-center justify-center font-mono text-[10px] font-bold overflow-hidden cursor-pointer transition-all hover:opacity-90`}
                  >
                    {rawPct > 10 && pos.token}
                  </div>
                );
              })}
            </div>

            {/* Detailed Asset Grid with Interactive Hover-Reveal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5">
              {positions.map((pos, idx) => {
                const pct = ((pos.usdValue / totalUsdValue) * 100).toFixed(1);
                return (
                  <div
                    key={`${pos.token}-${idx}`}
                    className="group border-2 border-black p-3.5 bg-white hover:bg-black hover:text-white transition-all shadow-hard-sm cursor-default"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-display font-black text-sm uppercase">
                          {pos.token}
                        </span>
                        <p className="font-mono text-xs text-gray-500 group-hover:text-gray-300">
                          {pos.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-black text-sm">
                          {pct}%
                        </span>
                        <p className="font-mono text-xs text-gray-600 group-hover:text-electric font-bold">
                          {formatCurrency(pos.usdValue)}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Hover Reveal */}
                    <div className="max-h-0 opacity-0 group-hover:max-h-12 group-hover:opacity-100 transition-all duration-200 overflow-hidden pt-0 group-hover:pt-2 border-t border-transparent group-hover:border-gray-700 mt-1">
                      <p className="font-mono text-[10px] text-gray-400">
                        Exposure Tier: {Number(pct) > 60 ? "HIGH CONCENTRATION WARNING" : "OPTIMAL SAFETY BUFFER"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 border-2 border-black bg-electric text-white flex items-center justify-center font-mono font-black text-xl shadow-hard-sm">
              ∑
            </div>
            <p className="font-display text-base font-black uppercase tracking-tight">
              NO ASSET POSITIONS DETECTED
            </p>
            <p className="font-mono text-xs text-gray-500 max-w-sm">
              Enter an EVM wallet, multisig, or treasury address above to inspect live on-chain token distributions and concentration risk.
            </p>
          </div>
        )}
      </div>

      <div className="border-t-2 border-black pt-3 flex justify-between items-center font-mono text-[11px] text-gray-500">
        <span>VALUATION SOURCE: ETHERS V6 / COINGECKO TWAP</span>
        <span className="font-bold text-black">TOTAL: {formatCurrency(totalUsdValue)}</span>
      </div>
    </div>
  );
}
