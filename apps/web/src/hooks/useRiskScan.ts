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

  const scan = useCallback(async (address: string, policy?: string): Promise<TreasuryScanResult | null> => {
    if (!address.trim()) {
      setError("Please enter a valid Ethereum treasury or wallet address");
      return null;
    }

    setLoading(true);
    setError(null);
    setStep("FETCHING_BALANCES");

    try {
      // Start the actual network scan immediately
      const scanPromise = runRiskScan(address, policy);

      // Fast UI progression while awaiting network response
      const t1 = setTimeout(() => setStep("ANALYZING_RISK"), 150);
      const t2 = setTimeout(() => setStep("GENERATING_PLAN"), 350);
      const t3 = setTimeout(() => setStep("ENFORCING_GOVERNANCE"), 550);

      const scanResult = await scanPromise;

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      // Register background monitoring in parallel
      void Promise.allSettled([
        registerWhaleWatcher(address),
        registerLiquidShield(address),
      ]);

      setResult(scanResult);
      setStep("COMPLETE");
      return scanResult;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err || "Failed to scan treasury. Verify connection.");
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
