"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LandingPage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const socialProofItems = [
    "AAVE V3 LIQUIDATION ENGINE",
    "IQAI ADK-TS AGENT RUNNER",
    "AGENT TOKENIZATION PLATFORM (ATP)",
    "ETHEREUM DEFENSE ALLIANCE",
    "MULTI-AGENT SOLVENCY",
    "UNISWAP V3 TWAP ORACLES",
    "MAKERDAO DEFENSIVE PEGS",
    "EIGENLAYER SURVEILLANCE",
  ];

  return (
    <div className="min-h-screen bg-white text-black font-body selection:bg-electric selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* =========================================================================
            HERO SECTION: EDGE-TO-EDGE DISPLAY TYPE & SINGLE BOLD CTA
        ========================================================================= */}
        <section className="border-b-2 border-black bg-white rigid-grid relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
            
            {/* Top pill badge */}
            <div className="flex items-center gap-3 mb-6">
              <span className="border-2 border-black bg-white px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-widest shadow-hard-sm">
                ELECTROTHON 8.0 // WWHS?
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 border-2 border-black bg-electric text-white px-3 py-1 text-xs font-mono font-bold uppercase shadow-hard-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                ADK-TS ON-CHAIN SENTINEL
              </span>
            </div>

            {/* Edge-to-edge Display Headline (Oversized 72px+) */}
            <div className="space-y-4">
              <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.88] text-black">
                AUTONOMOUS <br />
                <span className="text-electric">ON-CHAIN</span> <br />
                DEFENSE.
              </h1>

              {/* Raw Serif Editorial Statement */}
              <p className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-gray-800 max-w-4xl pt-4 leading-tight">
                "In decentralized finance, by the time a human operator notices liquidation risk, the treasury is already drained."
              </p>

              {/* Satoshi Body Description */}
              <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl font-medium pt-2 leading-relaxed">
                Chain Sentinel is a real-time, multi-agent intelligence and autonomous risk-containment platform. Built entirely with <strong>ADK-TS</strong> and deployed on the <strong>Agent Tokenization Platform (ATP)</strong>, it surveils Aave V3 lending debt, correlates mempool whale transfers, and executes deterministic defense before loss occurs.
              </p>
            </div>

            {/* Single Bold CTA Button */}
            <div className="pt-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Link href="/dashboard">
                <button className="btn-neo-primary text-base sm:text-lg tracking-wider shadow-hard-lg hover:shadow-hard-md hover:-translate-x-1 hover:-translate-y-1">
                  Launch Sentinel Dashboard →
                </button>
              </Link>
              
              <div className="font-mono text-xs text-gray-600 flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-green-500 border border-black"></span>
                Zero-latency WebSocket streams & Mempool listeners active
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            MARQUEE SCROLL: SOCIAL PROOF BAR
        ========================================================================= */}
        <section className="border-b-2 border-black bg-black text-white py-4 overflow-hidden relative select-none">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...socialProofItems, ...socialProofItems].map((item, idx) => (
              <div key={idx} className="flex items-center mx-6 font-mono text-xs sm:text-sm font-bold uppercase tracking-widest">
                <span className="text-electric mr-3">◆</span>
                <span>{item}</span>
                <span className="text-gray-600 ml-6">//</span>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            3-COLUMN FEATURE GRID BELOW WITH NUMBERED BENEFIT CARDS
        ========================================================================= */}
        <section className="py-20 md:py-28 bg-[#fafafa] border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-black pb-8">
              <div>
                <span className="font-mono text-xs font-black uppercase text-electric tracking-widest block mb-2">
                  // THREE-TIER DEFENSE PROTOCOL
                </span>
                <h2 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-black">
                  Engineered For Total Solvency
                </h2>
              </div>
              <p className="font-serif italic text-lg sm:text-xl text-gray-700 max-w-md">
                Three autonomous agent layers working in continuous consensus to eliminate liquidation lag.
              </p>
            </div>

            {/* 3-Column Asymmetric Feature Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              
              {/* CARD 01: Pre-emptive Threat Correlation */}
              <div
                onMouseEnter={() => setHoveredCard(1)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group border-2 border-black p-8 bg-white shadow-hard card-neo-punchy flex flex-col justify-between relative"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start border-b-2 border-black pb-4">
                    <span className="font-display text-5xl font-black text-black">
                      01
                    </span>
                    <span className="border-2 border-black bg-[#f4f4f4] px-2.5 py-1 font-mono text-xs font-bold uppercase">
                      SURVEILLANCE
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-black uppercase tracking-tight">
                    Pre-Emptive Threat Correlation
                  </h3>

                  <p className="text-sm text-gray-700 leading-relaxed font-medium">
                    Correlates sudden mempool whale movements (WhaleWatch) against active Aave V3 lending collateral health factors (LiquidShield) to detect cascade liquidations before the block finalizes.
                  </p>
                </div>

                {/* Interactive Hover-Reveal Section */}
                <div className="mt-8 pt-6 border-t-2 border-black bg-gray-50 -mx-8 -mb-8 p-8 transition-colors group-hover:bg-black group-hover:text-white">
                  <span className="font-mono text-[11px] font-bold uppercase text-electric block mb-1">
                    [ HOVER TELEMETRY REVEAL ]
                  </span>
                  <div className="font-mono text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 group-hover:text-gray-400">Detection Latency:</span>
                      <span className="font-bold text-electric">&lt; 180ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 group-hover:text-gray-400">Trigger Scope:</span>
                      <span className="font-bold">Mempool + L2 Oracles</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 group-hover:text-gray-400">Compound Alerting:</span>
                      <span className="font-bold">Automatic Correlation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 02: Multi-Agent Governance Arbitration */}
              <div
                onMouseEnter={() => setHoveredCard(2)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group border-2 border-black p-8 bg-white shadow-hard card-neo-punchy flex flex-col justify-between relative lg:translate-y-4"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start border-b-2 border-black pb-4">
                    <span className="font-display text-5xl font-black text-electric">
                      02
                    </span>
                    <span className="border-2 border-black bg-electric text-white px-2.5 py-1 font-mono text-xs font-bold uppercase">
                      CONSENSUS
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-black uppercase tracking-tight">
                    Multi-Agent Governance Arbitration
                  </h3>

                  <p className="text-sm text-gray-700 leading-relaxed font-medium">
                    ADK-TS specialized agents (Risk, Planner, Governance) arbitrate mitigation steps. An LLM reasoning layer provides strategic foresight while hard deterministic rules prevent hallucinations or rogue executions.
                  </p>
                </div>

                {/* Interactive Hover-Reveal Section */}
                <div className="mt-8 pt-6 border-t-2 border-black bg-gray-50 -mx-8 -mb-8 p-8 transition-colors group-hover:bg-electric group-hover:text-white">
                  <span className="font-mono text-[11px] font-bold uppercase text-black group-hover:text-white block mb-1">
                    [ ARBITRATION FAILSAFE ]
                  </span>
                  <div className="font-mono text-xs space-y-1 text-black group-hover:text-white">
                    <div className="flex justify-between">
                      <span className="opacity-70">Agent Core:</span>
                      <span className="font-bold">ADK-TS (@iqai/adk)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Hard Safety Rule:</span>
                      <span className="font-bold">Deterministic Veto</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Consensus Engine:</span>
                      <span className="font-bold">Gemini AI SDK</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 03: ATP-Tokenized Defensive Rebalancing */}
              <div
                onMouseEnter={() => setHoveredCard(3)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group border-2 border-black p-8 bg-white shadow-hard card-neo-punchy flex flex-col justify-between relative"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start border-b-2 border-black pb-4">
                    <span className="font-display text-5xl font-black text-black">
                      03
                    </span>
                    <span className="border-2 border-black bg-[#f4f4f4] px-2.5 py-1 font-mono text-xs font-bold uppercase">
                      EXECUTION
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-black uppercase tracking-tight">
                    ATP-Tokenized Rebalancing
                  </h3>

                  <p className="text-sm text-gray-700 leading-relaxed font-medium">
                    Registered on the Agent Tokenization Platform (ATP). Translates threat signals into verifiable tokenized protection quotas, autonomous partial debt repayments, and emergency multisig pause transactions.
                  </p>
                </div>

                {/* Interactive Hover-Reveal Section */}
                <div className="mt-8 pt-6 border-t-2 border-black bg-gray-50 -mx-8 -mb-8 p-8 transition-colors group-hover:bg-black group-hover:text-white">
                  <span className="font-mono text-[11px] font-bold uppercase text-electric block mb-1">
                    [ ATP METADATA SPEC ]
                  </span>
                  <div className="font-mono text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 group-hover:text-gray-400">ATP Agent ID:</span>
                      <span className="font-bold text-electric">chain-sentinel-v1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 group-hover:text-gray-400">Token Model:</span>
                      <span className="font-bold">Defensive Quota (cSNT)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 group-hover:text-gray-400">Audit Proofs:</span>
                      <span className="font-bold">On-Chain State Proofs</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            RIGID BENTO GRID: ARCHITECTURAL TELEMETRY
        ========================================================================= */}
        <section className="py-20 md:py-28 bg-white border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="border-b-2 border-black pb-6">
              <span className="font-mono text-xs font-black uppercase text-electric tracking-widest block mb-1">
                // SYSTEM TELEMETRY & SPECIFICATIONS
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight">
                Asymmetric Architecture
              </h2>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Asymmetric Span 2 Card: Multi-Agent Pipeline */}
              <div className="md:col-span-2 border-2 border-black p-8 bg-white shadow-hard space-y-6">
                <div className="flex justify-between items-center border-b-2 border-black pb-3">
                  <h4 className="font-display text-xl font-black uppercase tracking-tight">
                    ADK-TS Multi-Agent Execution Flow
                  </h4>
                  <span className="font-mono text-xs bg-black text-white px-2 py-0.5">
                    PIPELINE // 6 AGENTS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-center">
                  <div className="border-2 border-black p-3 bg-[#f9f9f9] shadow-hard-sm">
                    <span className="text-electric font-bold block mb-1">[01] WATCHER</span>
                    <span className="text-gray-600">Reads Balances & Debt</span>
                  </div>
                  <div className="border-2 border-black p-3 bg-[#f9f9f9] shadow-hard-sm">
                    <span className="text-electric font-bold block mb-1">[02] RISK</span>
                    <span className="text-gray-600">Scores Exposure (0-100)</span>
                  </div>
                  <div className="border-2 border-black p-3 bg-[#f9f9f9] shadow-hard-sm">
                    <span className="text-electric font-bold block mb-1">[03] PLANNER</span>
                    <span className="text-gray-600">Synthesizes Actions</span>
                  </div>
                  <div className="border-2 border-black p-3 bg-[#f9f9f9] shadow-hard-sm">
                    <span className="text-electric font-bold block mb-1">[04] GOV</span>
                    <span className="text-gray-600">Enforces Hard Rules</span>
                  </div>
                </div>

                <p className="font-serif italic text-base text-gray-700">
                  Every step is verifiable and transparent. If an LLM hallucination suggests an unsafe rebalance, the deterministic governance circuit vetoes the transaction in under 2 milliseconds.
                </p>
              </div>

              {/* Asymmetric Span 1 Card: LiquidShield Status */}
              <div className="border-2 border-black p-8 bg-white shadow-hard flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
                    <h4 className="font-display text-xl font-black uppercase tracking-tight">
                      LiquidShield
                    </h4>
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
                  </div>
                  <p className="font-mono text-xs text-gray-600 mb-4">
                    Active Aave V3 lending surveillance across Ethereum and Arbitrum One.
                  </p>
                  <div className="border-2 border-black p-3 bg-black text-white font-mono text-xs space-y-1">
                    <div>POLICIES: CONSERVATIVE</div>
                    <div>HF THRESHOLD: 1.30</div>
                    <div>AUTO-REPAY: ENABLED</div>
                  </div>
                </div>

                <div className="pt-4 font-mono text-[11px] text-gray-500">
                  REFRESH CYCLE: 3000ms
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* =========================================================================
            FINAL CALL TO ACTION BANNER
        ========================================================================= */}
        <section className="bg-electric text-white py-20 border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter text-black">
              SECURE YOUR TREASURY NOW.
            </h2>
            <p className="font-serif italic text-xl sm:text-2xl text-black max-w-2xl mx-auto">
              Scan any EVM treasury address in seconds. Experience multi-agent defense engineered for zero-loss security.
            </p>
            <div className="pt-4">
              <Link href="/dashboard">
                <button className="border-2 border-black bg-white text-black font-display text-sm sm:text-base font-black uppercase tracking-widest px-10 py-5 shadow-hard hover:shadow-hard-md hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                  Launch Sentinel Operations Dashboard →
                </button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
