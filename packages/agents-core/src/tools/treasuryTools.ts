import type { TreasurySnapshot, RiskResult, ProtectionPlan } from "../types.ts";

/**
 * ADK Tools for Treasury Analysis
 * These are utility functions that agents can use or reference
 */

export const treasuryTools = {
  /**
   * Analyze treasury concentration risk
   */
  analyzeConcentration: (snapshot: TreasurySnapshot): { concentration: string; risk: number } => {
    const positionCount = snapshot.positions.length;
    if (positionCount === 1) {
      return { concentration: "100% single asset", risk: 40 };
    }
    if (positionCount === 2) {
      return { concentration: "2 assets", risk: 20 };
    }
    return { concentration: `${positionCount} assets diversified`, risk: 0 };
  },

  /**
   * Analyze treasury size exposure
   */
  analyzeSizeExposure: (totalUsdValue: number): { category: string; risk: number } => {
    if (totalUsdValue > 10_000_000) {
      return { category: "Enterprise-scale", risk: 30 };
    }
    if (totalUsdValue > 1_000_000) {
      return { category: "Large treasury", risk: 25 };
    }
    if (totalUsdValue > 100_000) {
      return { category: "Medium treasury", risk: 15 };
    }
    return { category: "Small treasury", risk: 5 };
  },

  /**
   * Generate base risk assessment
   */
  generateBaseRisk: (snapshot: TreasurySnapshot): RiskResult => {
    const concentration = treasuryTools.analyzeConcentration(snapshot);
    const sizeExposure = treasuryTools.analyzeSizeExposure(snapshot.totalUsdValue);

    const riskScore = Math.min(100, Math.max(5, concentration.risk + sizeExposure.risk + 10));
    let level: RiskResult["level"] = "LOW";
    if (riskScore >= 70) level = "HIGH";
    else if (riskScore >= 40) level = "MEDIUM";

    const issues: string[] = [];
    if (concentration.risk > 0) issues.push(`Treasury concentration risk: ${concentration.concentration}`);
    if (sizeExposure.risk > 0) issues.push(`Size exposure: ${sizeExposure.category}`);

    return {
      level,
      score: riskScore,
      issues
    };
  }
};

/**
 * Qwen LLM integration for ADK agents with retry logic
 */
export async function callQwenLLM(prompt: string, retries: number = 1): Promise<string> {
  const baseUrl = process.env.QWEN_API_URL;
  if (!baseUrl) {
    throw new Error("QWEN_API_URL not configured");
  }

  const timeout = 2500;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const endpoint = baseUrl.endsWith("/api/generate") ? baseUrl : `${baseUrl.replace(/\/$/, "")}/api/generate`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2.5:0.5b",
          prompt,
          stream: false,
          temperature: 0.3,
          top_p: 0.8
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (typeof data.response === "string" && data.response.trim().length > 0) {
        return data.response;
      }
      if (data.message?.content && typeof data.message.content === "string" && data.message.content.trim().length > 0) {
        return data.message.content;
      }
      if (typeof data === "string" && data.trim().length > 0) {
        return data;
      }

      throw new Error("Empty response from LLM");
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[Qwen LLM] Attempt ${attempt + 1}/${retries} failed: ${errorMsg}`);

      if (isLastAttempt) {
        throw new Error(`LLM call failed after ${retries} attempts: ${errorMsg}`);
      }

      // Exponential backoff before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  throw new Error("LLM call exhausted all retries");
}

/**
 * Safe JSON extraction from LLM response
 * Handles markdown, extra text, and various formats
 */
export function extractJSON<T = any>(text: string): T {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid input: expected string");
  }

  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Try to find JSON object by brackets
  let jsonStr = "";
  let depth = 0;
  let startIdx = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (char === "{") {
      if (depth === 0) startIdx = i;
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0 && startIdx !== -1) {
        jsonStr = cleaned.slice(startIdx, i + 1);
        break;
      }
    }
  }

  if (!jsonStr) {
    throw new Error(`No valid JSON object found in response: "${cleaned.substring(0, 100)}..."`);
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
}
