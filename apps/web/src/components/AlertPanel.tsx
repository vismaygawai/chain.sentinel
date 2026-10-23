'use client';

import type { CompoundAlert } from '@/types';

interface AlertPanelProps {
  alerts: CompoundAlert[];
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function truncateTxHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function formatUSD(value: string): string {
  const num = parseFloat(value);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function formatTimestamp(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'JUST NOW';
  if (diffMin < 60) return `${diffMin}M AGO`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}H AGO`;
  return new Date(timestamp).toLocaleDateString();
}

function getUrgencyConfig(urgency: string): { label: string; className: string } {
  switch (urgency) {
    case 'CRITICAL':
      return { label: 'CRITICAL', className: 'bg-red-600 text-white' };
    case 'HIGH':
      return { label: 'HIGH', className: 'bg-orange-500 text-white' };
    case 'MEDIUM':
      return { label: 'MEDIUM', className: 'bg-yellow-400 text-black' };
    default:
      return { label: 'LOW', className: 'bg-electric text-white' };
  }
}

export default function AlertPanel({ alerts }: AlertPanelProps) {
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.isCorrelated && !b.isCorrelated) return -1;
    if (!a.isCorrelated && b.isCorrelated) return 1;
    const tsA = a.wwAlert?.timestamp || a.lsAlert?.timestamp || 0;
    const tsB = b.wwAlert?.timestamp || b.lsAlert?.timestamp || 0;
    return tsB - tsA;
  });

  if (sortedAlerts.length === 0) {
    return (
      <div className="bg-white border-2 border-black shadow-hard p-10 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-2 border-black bg-electric text-white flex items-center justify-center font-mono font-black text-xl mb-3 shadow-hard-sm">
          !
        </div>
        <p className="font-display text-xl font-black uppercase tracking-tight">NO ACTIVE THREAT SIGNALS</p>
        <p className="font-mono text-xs text-gray-500 mt-1">Continuous mempool & lending surveillance active.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black shadow-hard flex flex-col h-full">
      <div className="border-b-2 border-black p-5 flex items-center justify-between bg-white">
        <h2 className="font-display text-xl font-black uppercase tracking-tight flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-electric animate-ping"></span>
          REAL-TIME ALERT FEED
        </h2>
        <span className="border-2 border-black bg-black text-white px-2.5 py-1 font-mono font-bold text-xs uppercase tracking-widest shadow-hard-sm">
          {alerts.length} SIGNALS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y-2 divide-black max-h-[480px]">
        {sortedAlerts.map((alert, idx) => {
          const urgencyConfig = getUrgencyConfig(alert.combinedUrgency);
          const ts = alert.wwAlert?.timestamp || alert.lsAlert?.timestamp || Date.now();

          return (
            <div
              key={`${alert.walletAddress}-${ts}-${idx}`}
              className={`p-5 transition-colors hover:bg-gray-50 ${alert.isCorrelated ? 'bg-blue-50/40' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {alert.isCorrelated && (
                    <span className="bg-electric text-white px-2 py-0.5 font-mono font-black text-[10px] uppercase border-2 border-black shadow-hard-sm">
                      CORRELATED
                    </span>
                  )}
                  <span className="font-mono text-xs font-bold text-black">
                    {truncateAddress(alert.walletAddress)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-gray-500 font-bold">
                    {formatTimestamp(ts)}
                  </span>
                  <span className={`px-2 py-0.5 font-mono text-[10px] font-black uppercase border-2 border-black ${urgencyConfig.className}`}>
                    {urgencyConfig.label}
                  </span>
                </div>
              </div>

              {/* Threat details */}
              <div className="space-y-2 font-mono text-xs">
                {alert.wwAlert && (
                  <div className="border border-black p-2.5 bg-white">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Whale Movement</span>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="font-bold text-black">{formatUSD(alert.wwAlert.amount)} in {alert.wwAlert.token}</span>
                      <span className="text-gray-500 text-[10px]">{truncateTxHash(alert.wwAlert.txHash)}</span>
                    </div>
                  </div>
                )}

                {alert.lsAlert && (
                  <div className="border border-black p-2.5 bg-white">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Aave Position Shift</span>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="font-bold text-red-600">Health Factor: {parseFloat(alert.lsAlert.healthFactor).toFixed(2)}</span>
                      <span className="text-gray-500 text-[10px]">Collateral: {formatUSD(alert.lsAlert.collateral)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
