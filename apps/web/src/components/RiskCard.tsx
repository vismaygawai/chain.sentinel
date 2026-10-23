"use client";

import type { RiskResult } from "@/types/index";

interface RiskCardProps {
  risk: RiskResult | null;
}

export default function RiskCard({ risk }: RiskCardProps) {
  const isLoaded = risk !== null;
  const score = risk?.score ?? 0;
  const level = risk?.level || "STANDBY";
  const tier = risk?.tier || (score > 70 ? "CRITICAL" : score > 40 ? "WARNING" : isLoaded ? "SAFE" : "STANDBY");

  const tierColors = {
    SAFE: "bg-green-100 text-green-900 border-green-700",
    WARNING: "bg-yellow-100 text-yellow-900 border-yellow-700",
    DANGER: "bg-orange-100 text-orange-900 border-orange-700",
    CRITICAL: "bg-red-100 text-red-900 border-red-700",
    STANDBY: "bg-gray-100 text-gray-700 border-gray-400",
  }[tier] || "bg-gray-100 text-black border-black";

  return (
    <div className="group border-2 border-black p-6 bg-white shadow-hard transition-all hover:shadow-hard-lg hover:-translate-y-1 flex flex-col justify-between h-full space-y-6">
      
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <h3 className="font-display text-lg font-black uppercase tracking-tight">
              Risk & Vulnerability Engine
            </h3>
            <p className="font-serif italic text-xs text-gray-600">
              ADK-TS multi-agent exposure arbitration
            </p>
          </div>
          <span className={`font-mono text-xs font-black px-2.5 py-1 border-2 ${tierColors}`}>
            TIER: {tier}
          </span>
        </div>

        {/* Main Score & Metric Display */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <div>
            <span className="font-mono text-xs uppercase text-gray-500 block">
              Composite Threat Score
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display text-5xl font-black text-black tracking-tight">
                {isLoaded ? score : "--"}
              </span>
              <span className="font-mono text-sm font-bold text-gray-400">/100</span>
            </div>
          </div>

          <div className="border-l-2 border-black pl-4 space-y-1.5 font-mono text-xs">
            <div>
              <span className="text-gray-500">Severity: </span>
              <span className="font-bold text-black uppercase">{level}</span>
            </div>
            <div>
              <span className="text-gray-500">Health Factor: </span>
              <span className="font-bold text-black">
                {risk?.healthFactor ? risk.healthFactor.toFixed(2) : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Arbitration: </span>
              <span className="font-bold text-electric">
                {isLoaded ? "ADK-TS // Gemini" : "Awaiting Target"}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Risk Gauge */}
        <div>
          <div className="flex justify-between font-mono text-[10px] text-gray-500 mb-1">
            <span>0 (SECURE)</span>
            <span>50 (ELEVATED)</span>
            <span>100 (CRITICAL)</span>
          </div>
          <div className="w-full h-3 border-2 border-black bg-gray-100 overflow-hidden">
            <div
              style={{ width: `${isLoaded ? Math.min(100, Math.max(5, score)) : 0}%` }}
              className={`h-full transition-all duration-500 ${
                score > 70 ? "bg-red-600" : score > 40 ? "bg-yellow-500" : "bg-green-500"
              }`}
            ></div>
          </div>
        </div>

        {/* Narrative */}
        <div className="bg-[#f9f9f9] border border-black p-3.5 font-mono text-xs text-gray-800 leading-relaxed">
          {isLoaded
            ? risk?.narrative || "Treasury monitored. Exposure and collateral health within normal bounds."
            : "System standby. Enter any EVM wallet or treasury address above to analyze real-time exposure."}
        </div>
      </div>

      {/* Interactive Hover-Reveal: Detected Threat Vectors */}
      <div className="border-t-2 border-black pt-4">
        <div className="flex justify-between items-center text-xs font-display font-black uppercase cursor-pointer">
          <span>Detected Threat Vectors</span>
          <span className="font-mono text-[10px] text-electric underline group-hover:no-underline">
            {risk?.issues?.length || 0} ITEMS
          </span>
        </div>

        <div className="mt-2.5 space-y-2">
          {!isLoaded ? (
            <div className="bg-gray-50 border border-gray-300 p-2 font-mono text-xs text-gray-500 flex items-center gap-2">
              <span>Awaiting address scan to evaluate threat vectors.</span>
            </div>
          ) : risk?.issues && risk.issues.length > 0 ? (
            risk.issues.map((issue, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-red-50 border border-red-300 p-2 font-mono text-xs text-red-900"
              >
                <span className="font-black text-red-600">!</span>
                <span>{issue}</span>
              </div>
            ))
          ) : (
            <div className="bg-green-50 border border-green-300 p-2 font-mono text-xs text-green-900 flex items-center gap-2">
              <span className="font-black text-green-600">✓</span>
              <span>No critical solvency or liquidation threats detected.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
