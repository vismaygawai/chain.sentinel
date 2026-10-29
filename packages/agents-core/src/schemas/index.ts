import { z } from 'zod';

export const RiskSignalValidationSchema = z.object({
  signalId: z.string(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  protocol: z
    .enum(['aave-v3', 'uniswap-v3', 'makerdao', 'compound-v3', 'eigenlayer', 'general-treasury'])
    .optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  healthFactor: z.number().min(0).optional(),
  riskScore: z.number().min(0).max(100),
  detectedIssues: z.array(z.string()).optional(),
  compoundAlert: z
    .object({
      isCorrelated: z.boolean().optional(),
      whaleMoveAmountUSD: z.number().optional(),
      liquidationDistancePct: z.number().optional(),
      combinedUrgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    })
    .optional(),
  governanceRecommendation: z
    .object({
      approved: z.boolean(),
      actionType: z.enum(['ALERT', 'REDUCE', 'DIVERSIFY', 'EMERGENCY_PAUSE']),
      reason: z.string(),
    })
    .optional(),
  timestamp: z.number().int(),
});

export type ValidatedRiskSignal = z.infer<typeof RiskSignalValidationSchema>;
