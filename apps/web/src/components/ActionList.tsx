"use client";

import { useState } from "react";
import type { ProtectionPlan, GovernanceDecision } from "@/types/index";

interface ActionListProps {
  plan?: ProtectionPlan | null;
  decision?: GovernanceDecision | null;
}

export default function ActionList({ plan, decision }: ActionListProps) {
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);

  const isLoaded = Boolean(decision || plan);
  const actions = decision?.enforcedActions || plan?.actions || [];

  const handleSimulateExecution = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      setExecuted(true);
      setTimeout(() => setExecuted(false), 5000);
    }, 1200);
  };

  return (
    <div className="border-2 border-black p-6 bg-white shadow-hard flex flex-col justify-between h-full space-y-6">
      
      {/* Top Content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <h3 className="font-display text-lg font-black uppercase tracking-tight">
              Governance Action Queue
            </h3>
            <p className="font-serif italic text-xs text-gray-600">
              Autonomous multi-agent consensus decisions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isLoaded ? (
              <span className="font-mono text-xs bg-gray-100 text-gray-700 border border-gray-400 px-2.5 py-1 font-bold">
                STATUS: STANDBY
              </span>
            ) : decision?.approved !== false ? (
              <span className="font-mono text-xs bg-green-100 text-green-900 border border-green-700 px-2.5 py-1 font-bold">
                CONSENSUS: APPROVED
              </span>
            ) : (
              <span className="font-mono text-xs bg-red-100 text-red-900 border border-red-700 px-2.5 py-1 font-bold">
                CONSENSUS: PENDING
              </span>
            )}
          </div>
        </div>

        {/* Decision Rationale */}
        <div className="bg-[#f4f4f4] border border-black p-3.5 font-mono text-xs text-black">
          <span className="font-bold uppercase text-gray-600 block mb-1">Arbitration Rationale:</span>
          {isLoaded
            ? decision?.reason || "System verified. Position complies with active risk tolerance rules."
            : "Awaiting target telemetry. Autonomous consensus decisions will populate upon address scan."}
        </div>

        {/* Action Items List */}
        <div className="space-y-3">
          {!isLoaded || actions.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 p-6 text-center font-mono text-xs text-gray-500">
              No actions currently queued. Scan a treasury to evaluate protection rules.
            </div>
          ) : (
            actions.map((act, idx) => {
              const typeBadge = {
                ALERT: "bg-yellow-200 text-yellow-950 border-black",
                REDUCE: "bg-red-200 text-red-950 border-black",
                DIVERSIFY: "bg-blue-200 text-blue-950 border-black",
              }[act.type] || "bg-gray-200 text-black border-black";

              return (
                <div
                  key={idx}
                  className="border-2 border-black p-3.5 bg-white shadow-hard-sm flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className={`inline-block font-mono text-[10px] font-black uppercase px-2 py-0.5 border ${typeBadge}`}>
                      {act.type}
                    </span>
                    <p className="font-mono text-xs text-gray-900 leading-normal">
                      {act.message}
                    </p>
                  </div>

                  <div className="shrink-0 font-mono text-[11px] text-gray-500 font-bold">
                    STEP #{idx + 1}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Execution Button */}
      <div className="pt-4 border-t-2 border-black">
        {executed ? (
          <div className="w-full bg-green-500 text-white font-display text-xs font-black uppercase tracking-wider py-3.5 border-2 border-black text-center shadow-hard-sm">
            ✓ Defensive Rebalance Successfully Simulated on Aave V3
          </div>
        ) : (
          <button
            onClick={handleSimulateExecution}
            disabled={!isLoaded || executing}
            className="w-full bg-black text-white hover:bg-electric border-2 border-black font-display text-xs font-black uppercase tracking-wider py-3.5 shadow-hard hover:shadow-hard-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {executing ? "Simulating On-Chain Transaction..." : isLoaded ? "Simulate Defensive Rebalance →" : "Awaiting Target Scan"}
          </button>
        )}
      </div>
    </div>
  );
}
