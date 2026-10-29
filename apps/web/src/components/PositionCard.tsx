'use client';

import type { LiquidShieldPosition, RiskTier } from '@/types';
import { formatCompactUSD } from '@/lib/api';

interface PositionCardProps {
  position: LiquidShieldPosition;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getTierConfig(tier: RiskTier): { label: string; className: string } {
  switch (tier) {
    case 'CRITICAL':
      return { label: 'CRITICAL', className: 'bg-red-600 text-white' };
    case 'DANGER':
      return { label: 'DANGER', className: 'bg-orange-500 text-white' };
    case 'WARNING':
      return { label: 'WARNING', className: 'bg-yellow-400 text-black' };
    default:
      return { label: 'SAFE', className: 'bg-green-500 text-white' };
  }
}

function calculateGaugeFill(hf: number): number {
  const min = 1.0;
  const max = 3.0;
  if (hf <= min) return 0;
  if (hf >= max) return 100;
  return ((hf - min) / (max - min)) * 100;
}

export default function PositionCard({ position }: PositionCardProps) {
  const latestSnapshot = position.snapshots?.[0];
  const hf = latestSnapshot ? parseFloat(latestSnapshot.healthFactor) : 0;
  const debtVal = parseFloat(latestSnapshot?.debt || '0');
  const isNoDebt = debtVal === 0 || hf > 100 || !isFinite(hf);

  let tier: RiskTier;
  if (isNoDebt) tier = 'SAFE';
  else if (hf < 1.1) tier = 'CRITICAL';
  else if (hf < 1.3) tier = 'DANGER';
  else if (hf < 2.0) tier = 'WARNING';
  else tier = 'SAFE';

  const tierConfig = getTierConfig(tier);
  const gaugeFill = isNoDebt ? 100 : calculateGaugeFill(hf);

  return (
    <div
      className={`group bg-white border-2 border-black p-6 flex flex-col gap-5 transition-all hover:shadow-hard-lg shadow-hard hover:-translate-y-1 relative overflow-hidden ${
        tier === 'CRITICAL' ? 'border-red-600' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="font-mono text-xs text-gray-500 block uppercase">Aave V3 Position</span>
          <span className="font-mono text-sm font-bold text-electric">
            {truncateAddress(position.address)}
          </span>
        </div>
        <div className={`px-2.5 py-1 text-xs font-mono font-black uppercase border-2 border-black ${tierConfig.className}`}>
          {tierConfig.label}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 py-2">
        <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">
          Lending Health Factor
        </div>
        <div className="flex items-baseline justify-center gap-2 max-w-full">
          <span className="font-display text-4xl font-black text-black">
            {isNoDebt ? '∞' : hf > 0 ? hf.toFixed(2) : '—'}
          </span>
          {isNoDebt && (
            <span className="font-mono text-[10px] font-bold text-gray-600 uppercase tracking-wider bg-gray-100 border border-black px-1.5 py-0.5">
              NO DEBT
            </span>
          )}
        </div>
        <div className="w-full bg-[#f4f4f4] border-2 border-black h-3 overflow-hidden mt-1">
          <div
            className={`h-full transition-all duration-500 ${
              isNoDebt
                ? 'bg-green-500'
                : tier === 'CRITICAL' || tier === 'DANGER'
                ? 'bg-red-600'
                : tier === 'WARNING'
                ? 'bg-yellow-400'
                : 'bg-green-500'
            }`}
            style={{ width: `${gaugeFill}%` }}
          />
        </div>
        <div className="w-full flex justify-between font-mono text-[10px] text-gray-500">
          <span>1.0 (LIQUIDATION)</span>
          <span>2.0 (TARGET)</span>
          <span>3.0+ (SAFE)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t-2 border-black font-mono text-xs">
        <div>
          <span className="text-gray-500 block text-[10px] uppercase">Collateral</span>
          <span className="font-bold text-black">{formatCompactUSD(latestSnapshot?.collateral || '0')}</span>
        </div>
        <div>
          <span className="text-gray-500 block text-[10px] uppercase">Borrow Debt</span>
          <span className="font-bold text-black">{formatCompactUSD(latestSnapshot?.debt || '0')}</span>
        </div>
      </div>

      {/* Interactive Hover-Reveal */}
      <div className="border-t-2 border-black pt-3 max-h-0 opacity-0 group-hover:max-h-32 group-hover:opacity-100 transition-all duration-200 overflow-hidden">
        <span className="font-mono text-[10px] text-electric font-bold block mb-1">
          {"// SENTINEL DEFENSIVE RECOMMENDATION"}
        </span>
        <p className="font-mono text-xs text-gray-800 leading-relaxed">
          {!isNoDebt && hf < 1.3
            ? `Execute emergency partial repay to elevate HF above 1.50 threshold.`
            : `Position safe. Continuous polling frequency set at 3.0s.`}
        </p>
      </div>
    </div>
  );
}
