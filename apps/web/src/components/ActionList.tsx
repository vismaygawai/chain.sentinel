"use client";

import { useState, useEffect, useRef } from "react";
import type { ProtectionPlan, GovernanceDecision } from "@/types/index";

interface ActionListProps {
  plan?: ProtectionPlan | null;
  decision?: GovernanceDecision | null;
}

export default function ActionList({ plan, decision }: ActionListProps) {
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const timer1 = useRef<NodeJS.Timeout | null>(null);
  const timer2 = useRef<NodeJS.Timeout | null>(null);

  const isLoaded = Boolean(decision || plan);
  const actions = decision?.enforcedActions || plan?.actions || [];
  const canSimulate = isLoaded && actions.length > 0 && decision?.approved !== false;

  const [prevTrigger, setPrevTrigger] = useState<unknown>(null);
  const currentTrigger = decision ?? plan;
  if (prevTrigger !== currentTrigger) {
    setPrevTrigger(currentTrigger);
    setExecuted(false);
    setExecuting(false);
  }

  useEffect(() => {
    return () => {
      if (timer1.current) clearTimeout(timer1.current);
      if (timer2.current) clearTimeout(timer2.current);
    };
  }, []);

  const handleSimulateExecution = () => {
    if (!canSimulate) return;
    setExecuting(true);
    timer1.current = setTimeout(() => {
      setExecuting(false);
      setExecuted(true);
      timer2.current = setTimeout(() => setExecuted(false), 5000);
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
                CONSENSUS: BLOCKED
              </span>
            )}
          </div>
        </div>

        {/* Decision Rationale */}
        <div className="bg-[#f4f4f4] border border-black p-3.5 font-mono text-xs text-black">
          <span className="text-gray-500 font-bold block mb-1">
            ARBITRATION RATIONALE:
          </span>
          <p className="leading-relaxed">
            {decision?.reason || "Awaiting target scan to evaluate governance safety envelope."}
          </p>
        </div>

        {/* Actions List */}
        <div className="space-y-3">
          <span className="font-mono text-xs font-bold text-gray-500 block uppercase tracking-wider">
            Mandated Mitigation Actions ({actions.length})
          </span>

          {actions.length === 0 ? (
            <div className="border border-dashed border-gray-300 p-6 text-center font-mono text-xs text-gray-400">
              No defensive actions currently mandated
            </div>
          ) : (
            actions.map((act, idx) => {
              const typeColor =
                act.type === "REDUCE"
                  ? "bg-red-500 text-white"
                  : act.type === "DIVERSIFY"
                  ? "bg-electric text-white"
                  : "bg-black text-white";

              return (
                <div
                  key={idx}
                  className="border border-black p-3.5 bg-white flex items-center justify-between gap-4 shadow-hard-sm"
                >
                  <div className="space-y-1">
                    <span
                      className={`inline-block border border-black px-2 py-0.5 font-mono text-[10px] font-black uppercase ${typeColor}`}
                    >
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
            disabled={!canSimulate || executing}
            className="w-full bg-black text-white hover:bg-electric border-2 border-black font-display text-xs font-black uppercase tracking-wider py-3.5 shadow-hard hover:shadow-hard-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {executing
              ? "Simulating On-Chain Transaction..."
              : !isLoaded
              ? "Awaiting Target Scan"
              : decision?.approved === false
              ? "Simulation Blocked by Governance"
              : "Simulate Defensive Rebalance →"}
          </button>
        )}
      </div>
    </div>
  );
}
