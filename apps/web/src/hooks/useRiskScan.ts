import { useState, useCallback } from "react";
import type { TreasuryScanResult } from "@/types/index";
import { runRiskScan, registerWhaleWatcher, registerLiquidShield } from "@/lib/api";

export type ScanStep =
  | "IDLE"
  | "FETCHING_BALANCES"
  | "ANALYZING_RISK"
  | "GENERATING_PLAN"
  | "ENFORCING_GOVERNANCE"
  | "COMPLETE"
  | "ERROR";

export function useRiskScan() {
  const [step, setStep] = useState<ScanStep>("IDLE");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TreasuryScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (address: string): Promise<TreasuryScanResult | null> => {
    if (!address.trim()) {
      setError("Please enter a valid Ethereum treasury or wallet address");
      return null;
    }

    setLoading(true);
    setError(null);
    setStep("FETCHING_BALANCES");

    try {
      // Step 1: Query On-Chain Balances & Positions
      await new Promise((r) => setTimeout(r, 400));
      setStep("ANALYZING_RISK");

      // Step 2: Multi-Agent Risk Evaluation
      await new Promise((r) => setTimeout(r, 400));
      setStep("GENERATING_PLAN");

      // Step 3: Mitigation Strategy
      await new Promise((r) => setTimeout(r, 400));
      setStep("ENFORCING_GOVERNANCE");

      const scanResult = await runRiskScan(address);

      // Register background monitoring
      void registerWhaleWatcher(address);
      void registerLiquidShield(address);

      setResult(scanResult);
      setStep("COMPLETE");
      return scanResult;
    } catch (err: any) {
      const msg = err?.message || "Failed to scan treasury. Verify connection.";
      setError(msg);
      setStep("ERROR");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setStep("IDLE");
    setLoading(false);
  }, []);

  return {
    scan,
    reset,
    result,
    loading,
    error,
    step,
  };
}
