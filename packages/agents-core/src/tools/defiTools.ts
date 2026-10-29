import { ethers } from 'ethers';
import type { PositionSnapshot } from '../types.ts';

// Standard Aave V3 Pool Interface for reading position data
const AAVE_V3_POOL_ABI = [
  'function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
];

// Ethereum Mainnet Aave V3 Pool Address
export const AAVE_V3_POOL_ADDRESS = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';

export interface UserAccountData {
  totalCollateralUSD: number;
  totalDebtUSD: number;
  availableBorrowsUSD: number;
  currentLiquidationThreshold: number;
  ltv: number;
  healthFactor: number;
  isAtRisk: boolean;
  distanceToLiquidationPct: number;
  isError?: boolean;
}

/**
 * Fetch live Aave V3 account data from on-chain contract with automatic fallback
 */
export async function fetchAaveUserAccountData(
  walletAddress: string,
  providerOrUrl: ethers.Provider | string = 'https://ethereum.publicnode.com'
): Promise<UserAccountData> {
  try {
    const provider =
      typeof providerOrUrl === 'string'
        ? new ethers.JsonRpcProvider(providerOrUrl)
        : providerOrUrl;

    const normalizedAddress = ethers.getAddress(walletAddress);
    const contract = new ethers.Contract(AAVE_V3_POOL_ADDRESS, AAVE_V3_POOL_ABI, provider);

    const [
      totalCollateralBase,
      totalDebtBase,
      availableBorrowsBase,
      currentLiquidationThreshold,
      ltv,
      healthFactor,
    ] = await contract.getUserAccountData(normalizedAddress);

    // Aave base currency units are in 8 decimals (USD value with 8 decimals)
    const collateralUSD = Number(totalCollateralBase) / 1e8;
    const debtUSD = Number(totalDebtBase) / 1e8;
    const availableUSD = Number(availableBorrowsBase) / 1e8;
    const rawThreshold = Number(currentLiquidationThreshold) / 10000; // fraction, e.g. 0.825
    const ltvPct = Number(ltv) / 10000;
    const hf = Number(ethers.formatUnits(healthFactor, 18));

    let finalCollateralUSD = collateralUSD;
    let finalDebtUSD = debtUSD;
    let finalHF = hf;
    const finalThreshold = rawThreshold > 0 ? rawThreshold * 100 : 82.5;
    const finalLtv = ltvPct > 0 ? ltvPct * 100 : 75.0;

    if (finalDebtUSD === 0 || finalHF > 100 || !isFinite(finalHF)) {
      // When a wallet has $0 debt, health factor is infinite / not applicable
      finalHF = 0;
    }

    // Distance to liquidation: percentage fall in collateral before HF hits 1.0
    // HF = (Collateral * LiqThreshold) / Debt
    const distanceToLiquidation =
      finalCollateralUSD > 0 && finalDebtUSD > 0
        ? Math.max(0, (1 - (finalDebtUSD / (finalCollateralUSD * (finalThreshold / 100)))) * 100)
        : 100;

    return {
      totalCollateralUSD: finalCollateralUSD,
      totalDebtUSD: finalDebtUSD,
      availableBorrowsUSD: availableUSD,
      currentLiquidationThreshold: finalThreshold,
      ltv: finalLtv,
      healthFactor: finalHF,
      isAtRisk: finalDebtUSD > 0 && finalHF < 1.3,
      distanceToLiquidationPct: distanceToLiquidation,
    };
  } catch (err: any) {
    console.warn(`[defiTools] Failed to fetch Aave V3 data for ${walletAddress}:`, err?.message || err);
    return {
      totalCollateralUSD: 0,
      totalDebtUSD: 0,
      availableBorrowsUSD: 0,
      currentLiquidationThreshold: 0,
      ltv: 0,
      healthFactor: 0,
      isAtRisk: false,
      distanceToLiquidationPct: 100,
      isError: true,
    };
  }
}

/**
 * Calculates debt reduction needed to reach a target health factor
 */
export function calculateRequiredDebtRepayment(
  totalCollateralUSD: number,
  currentDebtUSD: number,
  liquidationThresholdPct: number,
  targetHF: number = 2.0
): number {
  if (currentDebtUSD <= 0) return 0;
  const thresholdFraction = liquidationThresholdPct > 1 ? liquidationThresholdPct / 100 : liquidationThresholdPct;
  const maxAllowedDebt = (totalCollateralUSD * thresholdFraction) / targetHF;
  if (currentDebtUSD <= maxAllowedDebt) return 0;
  return Math.max(0, currentDebtUSD - maxAllowedDebt);
}

/**
 * Converts account data to standardized PositionSnapshot
 */
export function toPositionSnapshot(
  walletAddress: string,
  data: UserAccountData,
  protocol: string = 'aave-v3'
): PositionSnapshot {
  const safeHF =
    data.isError
      ? 'UNKNOWN'
      : data.totalDebtUSD > 0 && isFinite(data.healthFactor) && data.healthFactor > 0 && data.healthFactor <= 100
      ? data.healthFactor.toFixed(4)
      : 'Infinity';
  return {
    walletAddress,
    healthFactor: safeHF,
    collateral: data.totalCollateralUSD.toFixed(2),
    debt: data.totalDebtUSD.toFixed(2),
    protocol,
    timestamp: Date.now(),
  };
}
