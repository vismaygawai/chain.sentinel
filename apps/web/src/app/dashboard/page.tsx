"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import RiskCard from "@/components/RiskCard";
import AllocationChart from "@/components/AllocationChart";
import PolicySelector, { PolicyMode } from "@/components/PolicySelector";
import ActionList from "@/components/ActionList";
import AlertPanel from "@/components/AlertPanel";
import PositionCard from "@/components/PositionCard";
import WalletCard from "@/components/WalletCard";
import { useRiskScan } from "@/hooks/useRiskScan";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { getMonitoredWorkflows, formatCurrency } from "@/lib/api";
import type { WalletInfo, LiquidShieldPosition } from "@/types/index";

export default function DashboardPage() {
  const [addressInput, setAddressInput] = useState("");
  const [activePolicy, setActivePolicy] = useState<PolicyMode>("CONSERVATIVE");
  const [watchedWallets, setWatchedWallets] = useState<WalletInfo[]>([]);
  const [watchedPositions, setWatchedPositions] = useState<LiquidShieldPosition[]>([]);
  const [streamFilter, setStreamFilter] = useState<"ALL" | "POSITIONS" | "WALLETS">("ALL");
  
  const { scan, reset, result, loading, error, step } = useRiskScan();
  const { alerts, isConnected } = useLiveFeed();

  const handleClear = () => {
    setAddressInput("");
    reset();
  };

  const fetchMonitored = useCallback(async () => {
    try {
      const monitored = await getMonitoredWorkflows();
      
      // Deduplicate wallets by address to prevent React duplicate key errors
      const uniqueWalletsMap = new Map<string, WalletInfo>();
      for (const w of monitored) {
        if (w.address) {
          uniqueWalletsMap.set(w.address.toLowerCase(), w);
        }
      }
      setWatchedWallets(Array.from(uniqueWalletsMap.values()));

      // Deduplicate positions
      const uniquePositionsMap = new Map<string, LiquidShieldPosition>();
      for (const m of monitored) {
        if (m.ls?.active && m.ls.lastSnapshot && m.address) {
          uniquePositionsMap.set(m.address.toLowerCase(), {
            address: m.address,
            protocol: "aave-v3",
            snapshots: m.ls.lastSnapshot || [],
          });
        }
      }
      setWatchedPositions(Array.from(uniquePositionsMap.values()));
    } catch {
      // Empty fallback
      setWatchedWallets([]);
      setWatchedPositions([]);
    }
  }, []);

  // Load user's registered surveillance workflows on mount via subscription lifecycle
  useEffect(() => {
    let isSubscribed = true;
    getMonitoredWorkflows()
      .then((monitored) => {
        if (!isSubscribed) return;
        const uniqueWalletsMap = new Map<string, WalletInfo>();
        for (const w of monitored) {
          if (w.address) {
            uniqueWalletsMap.set(w.address.toLowerCase(), w);
          }
        }
        setWatchedWallets(Array.from(uniqueWalletsMap.values()));

        const uniquePositionsMap = new Map<string, LiquidShieldPosition>();
        for (const m of monitored) {
          if (m.ls?.active && m.ls.lastSnapshot && m.address) {
            uniquePositionsMap.set(m.address.toLowerCase(), {
              address: m.address,
              protocol: "aave-v3",
              snapshots: m.ls.lastSnapshot || [],
            });
          }
        }
        setWatchedPositions(Array.from(uniquePositionsMap.values()));
      })
      .catch(() => {
        if (!isSubscribed) return;
        setWatchedWallets([]);
        setWatchedPositions([]);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addressInput.trim()) {
      await scan(addressInput.trim(), activePolicy);
      await fetchMonitored();
    }
  };

  const loadPreset = (presetAddr: string) => {
    setAddressInput(presetAddr);
    void scan(presetAddr, activePolicy);
  };

  const totalMonitoredVal = result?.snapshot?.totalUsdValue !== undefined ? result.snapshot.totalUsdValue : 0;
  const currentRiskScore = result?.risk?.score ?? 0;
  const currentRiskTier = result?.risk?.tier || (currentRiskScore > 70 ? "CRITICAL" : currentRiskScore > 40 ? "WARNING" : "SAFE");
  const currentHF = result?.risk?.healthFactor ? result.risk.healthFactor.toFixed(2) : "N/A";

  return (
    <div className="min-h-screen bg-[#fafafa] text-black font-body selection:bg-electric selection:text-white flex flex-col">
      <Navbar />
      
      <Header
        title="Operations Command Matrix"
        subtitle="Autonomous on-chain risk telemetry, multi-agent arbitration, and live threat streams."
      />

      {/* =========================================================================
          LIVE TELEMETRY BANNER & OPTIONAL SAMPLE TARGETS
      ========================================================================= */}
      <section className="border-b-2 border-black bg-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
          
          {/* Optional sample targets for testing */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-500 uppercase mr-1">TRY VERIFIED SAMPLES:</span>
            <button
              type="button"
              onClick={() => loadPreset("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")}
              className={`border-2 border-black px-3 py-1 font-bold shadow-hard-sm transition-all ${
                addressInput.toLowerCase().includes("d8da") ? "bg-black text-white" : "bg-white hover:bg-gray-100 text-black"
              }`}
            >
              Vitalik (0xd8dA...6045)
            </button>
            <button
              type="button"
              onClick={() => loadPreset("0x577da75775b0606b5d92582b1c67e9154b7c62c3")}
              className={`border-2 border-black px-3 py-1 font-bold shadow-hard-sm transition-all ${
                addressInput.toLowerCase().includes("577d") ? "bg-black text-white" : "bg-white hover:bg-gray-100 text-black"
              }`}
            >
              Aave Whale (0x577d...62c3)
            </button>
            {(addressInput || result) && (
              <button
                type="button"
                onClick={handleClear}
                className="border-2 border-black px-3 py-1 font-mono text-[11px] font-bold text-black hover:bg-black hover:text-white bg-white shadow-hard-sm transition-all"
              >
                Reset Grid ✕
              </button>
            )}
          </div>

          {/* WebSocket stream status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-2 border-black px-3 py-1 bg-[#f4f4f4] shadow-hard-sm">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-ping" : "bg-red-500"}`}></span>
              <span>WS STREAM: {isConnected ? "ONLINE" : "OFFLINE"}</span>
            </div>
            <div className="border-2 border-black px-3 py-1 bg-[#f4f4f4] shadow-hard-sm font-bold text-black">
              ATP REGISTRY: ACTIVE (cSNT)
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          TREASURY ADDRESS SCANNER INPUT
      ========================================================================= */}
      <section className="bg-white border-b-2 border-black py-7 px-4 sm:px-6 lg:px-8 rigid-grid">
        <div className="max-w-7xl mx-auto space-y-4">
          <form onSubmit={handleScanSubmit} className="flex flex-col md:flex-row items-stretch gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => {
                  setAddressInput(e.target.value);
                  if (!e.target.value.trim() && result) {
                    reset();
                  }
                }}
                placeholder="Enter EVM Treasury, Multisig, or Wallet Address (0x...)"
                className="w-full h-14 border-2 border-black px-5 pr-12 font-mono text-sm bg-white text-black shadow-hard focus:outline-none focus:ring-2 focus:ring-electric"
              />
              {(addressInput || result) && (
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear input and reset grid"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 border border-black bg-[#f4f4f4] hover:bg-black hover:text-white flex items-center justify-center font-mono font-bold text-xs transition-colors shadow-hard-sm"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !addressInput.trim()}
              className="btn-neo-primary h-14 text-sm px-8 shadow-hard hover:shadow-hard-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? "Surveilling Chain..." : "Scan Treasury →"}
            </button>
          </form>

          {/* Step indicator during scan */}
          {loading && (
            <div className="border-2 border-black p-4 bg-black text-white font-mono text-xs flex items-center justify-between shadow-hard">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-electric animate-ping"></span>
                <span className="font-bold uppercase tracking-wider">
                  ACTIVE PHASE: {step.replace(/_/g, " ")}
                </span>
              </div>
              <span className="text-gray-400 text-[11px]">Querying Ethereum Nodes & ADK Multi-Agents...</span>
            </div>
          )}

          {/* Scan Error alert */}
          {error && (
            <div className="border-2 border-red-600 bg-red-50 p-4 font-mono text-xs text-red-900 shadow-hard">
              <strong>SCAN ERROR:</strong> {error}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          HIGH-DENSITY BALANCED METRICS STRIP (4 EQUAL CARDS)
      ========================================================================= */}
      <section className="border-b-2 border-black bg-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="border-2 border-black p-4 bg-[#f9f9f9] shadow-hard-sm">
            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Total Valuation</span>
            <span className="font-display text-xl sm:text-2xl font-black text-black">
              {result ? formatCurrency(totalMonitoredVal) : "$0.00"}
            </span>
          </div>

          <div className="border-2 border-black p-4 bg-[#f9f9f9] shadow-hard-sm">
            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Threat Status</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl sm:text-2xl font-black text-black">
                {result ? `${currentRiskScore}/100` : "--/100"}
              </span>
              <span className="text-xs font-bold text-electric">
                ({result ? currentRiskTier : "STANDBY"})
              </span>
            </div>
          </div>

          <div className="border-2 border-black p-4 bg-[#f9f9f9] shadow-hard-sm">
            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Aave Health Factor</span>
            <span className="font-display text-xl sm:text-2xl font-black text-black">
              {result ? currentHF : "N/A"}
            </span>
          </div>

          <div className="border-2 border-black p-4 bg-[#f9f9f9] shadow-hard-sm">
            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Agent Pipeline</span>
            <span className="font-display text-xl sm:text-2xl font-black text-green-600">
              {result ? "6 ACTIVE (ADK-TS)" : "STANDBY (ADK-TS)"}
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          OPERATIONAL COMMAND MATRIX: BALANCED RIGID 2-COLUMN ROWS
      ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* ROW 1: Risk Engine (Left) & Governance Action Queue (Right) - Equal Height */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <RiskCard risk={result?.risk || null} />
          <ActionList plan={result?.plan || null} decision={result?.decision || null} />
        </div>

        {/* ROW 2: Portfolio Asset Allocation (Left) & Governance Policies (Right) - Equal Height */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <AllocationChart
            positions={result?.snapshot?.positions || []}
            totalUsdValue={result?.snapshot?.totalUsdValue || 0}
          />
          <PolicySelector
            currentPolicy={activePolicy}
            onSelectPolicy={(p) => {
              setActivePolicy(p);
              if (addressInput.trim() && result) {
                void scan(addressInput.trim(), p);
              }
            }}
          />
        </div>

        {/* ROW 3: On-Chain Surveillance Matrix (Left) & Real-Time Alert Feed (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Left Column: Unified Surveillance Panel */}
          <div className="border-2 border-black p-6 bg-white shadow-hard flex flex-col justify-between h-full space-y-5">
            <div>
              {/* Header with stream filter buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
                <div>
                  <h3 className="font-display text-lg font-black uppercase tracking-tight">
                    On-Chain Surveillance Stream
                  </h3>
                  <p className="font-serif italic text-xs text-gray-600">
                    LiquidShield lending positions & WhaleWatch mempool observers
                  </p>
                </div>
                
                {/* Filter toggle pills */}
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    onClick={() => setStreamFilter("ALL")}
                    className={`border border-black px-2 py-0.5 font-bold ${
                      streamFilter === "ALL" ? "bg-black text-white" : "bg-[#f4f4f4] hover:bg-gray-200"
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setStreamFilter("POSITIONS")}
                    className={`border border-black px-2 py-0.5 font-bold ${
                      streamFilter === "POSITIONS" ? "bg-black text-white" : "bg-[#f4f4f4] hover:bg-gray-200"
                    }`}
                  >
                    LENDING
                  </button>
                  <button
                    onClick={() => setStreamFilter("WALLETS")}
                    className={`border border-black px-2 py-0.5 font-bold ${
                      streamFilter === "WALLETS" ? "bg-black text-white" : "bg-[#f4f4f4] hover:bg-gray-200"
                    }`}
                  >
                    WHALES
                  </button>
                </div>
              </div>

              {/* Sub-grid of cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {watchedPositions.length === 0 && watchedWallets.length === 0 ? (
                  <div className="col-span-full border-2 border-dashed border-gray-300 p-8 text-center bg-[#fafafa]">
                    <div className="w-8 h-8 mx-auto mb-2 border-2 border-black bg-white flex items-center justify-center font-mono font-bold text-xs shadow-hard-sm">
                      ∅
                    </div>
                    <p className="font-mono font-bold text-xs uppercase text-gray-700 tracking-wide">
                      No Active Surveillance Targets
                    </p>
                    <p className="font-mono text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
                      Scan any treasury or wallet address above to register real-time WhaleWatch and LiquidShield surveillance.
                    </p>
                  </div>
                ) : (
                  <>
                    {(streamFilter === "ALL" || streamFilter === "POSITIONS") &&
                      watchedPositions.map((pos, idx) => (
                        <PositionCard key={`pos-${pos.address}-${idx}`} position={pos} />
                      ))}

                    {(streamFilter === "ALL" || streamFilter === "WALLETS") &&
                      watchedWallets.map((wallet, idx) => (
                        <WalletCard key={`wallet-${wallet.address}-${idx}`} wallet={wallet} />
                      ))}
                  </>
                )}
              </div>
            </div>

            <div className="border-t-2 border-black pt-3 flex justify-between items-center font-mono text-[11px] text-gray-500">
              <span>ACTIVE TARGETS: {watchedPositions.length + watchedWallets.length} ENTITIES</span>
              <span className="font-bold text-black">AAVE V3 // MEMPOOL RADAR</span>
            </div>
          </div>

          {/* Right Column: Live Event Stream Feed */}
          <AlertPanel alerts={alerts} />

        </div>

      </main>

      <Footer />
    </div>
  );
}
