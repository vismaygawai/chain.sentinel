import type { PositionSnapshot } from '../types.ts';
import { fetchAaveUserAccountData, toPositionSnapshot, calculateRequiredDebtRepayment } from './defiTools.ts';

export interface RepayRecommendation {
  token: string;
  amount: string;
  slippagePct: number;
}

export async function getHealthFactor(walletAddress: string): Promise<number> {
  const data = await fetchAaveUserAccountData(walletAddress);
  return data.healthFactor;
}

export async function getPositionSnapshot(walletAddress: string): Promise<PositionSnapshot> {
  const data = await fetchAaveUserAccountData(walletAddress);
  return toPositionSnapshot(walletAddress, data, 'aave-v3');
}

export async function calculateRepayAmount(
  snapshot: PositionSnapshot,
): Promise<RepayRecommendation> {
  const hf = parseFloat(snapshot.healthFactor);
  const debt = parseFloat(snapshot.debt);

  if (hf < 1.3 && debt > 0) {
    const required = calculateRequiredDebtRepayment(
      parseFloat(snapshot.collateral),
      debt,
      0.825,
      1.3
    );
    return {
      token: 'USDC',
      amount: required > 0 ? required.toFixed(2) : (debt * 0.2).toFixed(2),
      slippagePct: 0.5,
    };
  }

  return {
    token: 'USDC',
    amount: '0',
    slippagePct: 0,
  };
}
