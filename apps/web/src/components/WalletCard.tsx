'use client';

import type { WalletInfo } from '@/types';

interface WalletCardProps {
  wallet: WalletInfo;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) return 'No alerts yet';
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getIntentConfig(intent: string): { label: string; className: string } {
  switch (intent) {
    case 'CEX_DEPOSIT':
      return { label: 'CEX Deposit', className: 'bg-black text-white' };
    case 'ACCUMULATION':
      return { label: 'Accumulation', className: 'bg-green-600 text-white' };
    case 'DISTRIBUTION':
      return { label: 'Distribution', className: 'bg-red-600 text-white' };
    default:
      return { label: 'Active', className: 'bg-gray-200 text-black' };
  }
}

export default function WalletCard({ wallet }: WalletCardProps) {
  const intentConfig = getIntentConfig(wallet.intent || 'Active');

  return (
    <div className="group bg-white border-2 border-black p-6 flex flex-col justify-between gap-5 transition-all hover:shadow-hard-lg shadow-hard hover:-translate-y-1 relative">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-mono text-xs text-gray-500 block uppercase">WhaleWatch Monitored</span>
          <span className="font-mono text-sm font-bold text-electric">
            {truncateAddress(wallet.address)}
          </span>
        </div>
        <div className={`px-2.5 py-1 text-xs font-mono font-black uppercase border-2 border-black ${intentConfig.className}`}>
          {intentConfig.label}
        </div>
      </div>

      <div className="space-y-1 font-mono text-xs">
        <div className="flex justify-between border-b border-gray-200 pb-1">
          <span className="text-gray-500">Classification:</span>
          <span className="font-bold">{wallet.label || 'Whale Multisig'}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 pb-1 pt-1">
          <span className="text-gray-500">Last Activity:</span>
          <span className="font-bold">{formatTime(wallet.lastAlertTime || null)}</span>
        </div>
        <div className="flex justify-between pt-1">
          <span className="text-gray-500">Mempool Stream:</span>
          <span className="font-bold text-green-600">CONNECTED</span>
        </div>
      </div>

      {/* Interactive Hover Reveal */}
      <div className="border-t-2 border-black pt-3 max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-200 overflow-hidden">
        <span className="font-mono text-[10px] text-electric font-bold block mb-1">
          {"// CORRELATION STATUS"}
        </span>
        <p className="font-mono text-xs text-gray-800">
          Actively cross-referenced against lending market debt triggers.
        </p>
      </div>
    </div>
  );
}
