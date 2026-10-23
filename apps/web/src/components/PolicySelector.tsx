"use client";

import { useState } from "react";

export type PolicyMode = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";

interface PolicySelectorProps {
  currentPolicy?: PolicyMode;
  onSelectPolicy?: (policy: PolicyMode) => void;
}

const POLICY_SPECS = {
  CONSERVATIVE: {
    label: "Conservative",
    hf: "2.00+",
    maxConc: "35%",
    buffer: "30%",
    desc: "Strict safety buffer. Instant alerts at WARNING tier. Requires Multisig quorum.",
    color: "border-green-600",
  },
  BALANCED: {
    label: "Balanced",
    hf: "1.50+",
    maxConc: "55%",
    buffer: "20%",
    desc: "Standard market risk. Defensive rebalancing executed when health factor approaches 1.35.",
    color: "border-electric",
  },
  AGGRESSIVE: {
    label: "Aggressive",
    hf: "1.25+",
    maxConc: "75%",
    buffer: "10%",
    desc: "High capital efficiency. Auto-repay trigger executes only at critical liquidation boundary.",
    color: "border-red-600",
  },
};

export default function PolicySelector({
  currentPolicy = "CONSERVATIVE",
  onSelectPolicy,
}: PolicySelectorProps) {
  const [selected, setSelected] = useState<PolicyMode>(currentPolicy);

  const handleSelect = (mode: PolicyMode) => {
    setSelected(mode);
    if (onSelectPolicy) onSelectPolicy(mode);
  };

  return (
    <div className="border-2 border-black p-6 bg-white shadow-hard flex flex-col justify-between h-full space-y-5">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
          <div>
            <h3 className="font-display text-lg font-black uppercase tracking-tight">
              Governance Policy Engine
            </h3>
            <p className="font-serif italic text-xs text-gray-600">
              Configure autonomous enforcement boundaries
            </p>
          </div>
          <div className="font-mono text-xs border border-black bg-[#f4f4f4] px-2.5 py-1 self-start sm:self-auto font-bold">
            ACTIVE: {selected}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-5">
          {(["CONSERVATIVE", "BALANCED", "AGGRESSIVE"] as PolicyMode[]).map((mode) => {
            const spec = POLICY_SPECS[mode];
            const isSelected = selected === mode;
            return (
              <div
                key={mode}
                onClick={() => handleSelect(mode)}
                className={`cursor-pointer border-2 border-black p-4 transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? "bg-black text-white shadow-hard-blue translate-x-[-2px] translate-y-[-2px]"
                    : "bg-white text-black hover:bg-gray-50 shadow-hard-sm"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-display font-black text-sm uppercase tracking-wider">
                      {spec.label}
                    </span>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-electric animate-pulse"></span>
                    )}
                  </div>

                  <div className="space-y-1.5 font-mono text-xs mb-3">
                    <div className="flex justify-between">
                      <span className={isSelected ? "text-gray-400" : "text-gray-600"}>Min HF:</span>
                      <span className="font-bold">{spec.hf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isSelected ? "text-gray-400" : "text-gray-600"}>Max Conc:</span>
                      <span className="font-bold">{spec.maxConc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isSelected ? "text-gray-400" : "text-gray-600"}>Buffer:</span>
                      <span className="font-bold">{spec.buffer}</span>
                    </div>
                  </div>
                </div>

                <p className={`text-[11px] leading-tight pt-2 border-t ${isSelected ? "border-gray-800 text-gray-300" : "border-gray-100 text-gray-600"}`}>
                  {spec.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t-2 border-black pt-3 flex justify-between items-center font-mono text-[11px] text-gray-500">
        <span>ENFORCEMENT MODE: STRICT ADK ARBITRATION</span>
        <span className="font-bold text-electric">STATUS: ENGAGED</span>
      </div>
    </div>
  );
}
