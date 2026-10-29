import {
  runTreasuryWorkflow,
  watchWalletWorkflow,
  scanPositionWorkflow,
  alertCorrelator,
  prisma,
} from 'agents-core';

export class TreasuryService {
  public async scanTreasury(address: string, policy?: string) {
    return runTreasuryWorkflow(address, policy);
  }

  public async registerWhaleWatch(address: string) {
    await watchWalletWorkflow.registerWallet(address);
    return {
      status: 'registered',
      address,
      service: 'WhaleWatch',
      message: 'Wallet successfully registered for WhaleWatch mempool monitoring.',
    };
  }

  public async registerPosition(address: string) {
    await scanPositionWorkflow.registerPosition(address);
    return {
      status: 'registered',
      address,
      service: 'LiquidShield',
      message: 'Position successfully registered for LiquidShield Aave monitoring.',
    };
  }

  public getWhaleAlerts(address?: string) {
    if (address) {
      const recent = alertCorrelator.getRecentAlerts(address);
      const profile = watchWalletWorkflow.getWalletProfile(address);
      const alerts = recent.map((c) => c.wwAlert).filter(Boolean);
      if (alerts.length === 0 && profile?.lastWWSnapshot) {
        alerts.push(profile.lastWWSnapshot);
      }
      return { alerts, totalAlerts: alerts.length };
    }
    const recent = alertCorrelator.getRecentAlerts();
    const alerts = recent.map((c) => c.wwAlert).filter(Boolean);
    const windowStats = alertCorrelator.windowStats();
    return {
      alerts,
      totalAlerts: alerts.length || windowStats.activeWhaleAlerts,
      windowStats,
    };
  }

  public getHealthSnapshots(address: string) {
    const profile = scanPositionWorkflow.getWalletProfile(address);
    if (!profile || !profile.lastLSSnapshot) {
      return null;
    }
    return { address, snapshots: profile.lastLSSnapshot };
  }

  public async getMonitoredWorkflows() {
    const wallets = await prisma.wallet.findMany();
    return wallets.map((w: any) => {
      const wwProfile = watchWalletWorkflow.getWalletProfile(w.address);
      const lsProfile = scanPositionWorkflow.getWalletProfile(w.address);
      return {
        address: w.address,
        type: w.type,
        label: wwProfile?.lastWWSnapshot?.label || (w.type === 'WHALE' ? 'Whale Multisig' : 'Aave Position'),
        intent: wwProfile?.lastWWSnapshot?.intent || 'ACCUMULATION',
        lastAlertTime: wwProfile?.lastWWSnapshot?.timestamp || undefined,
        ww: wwProfile ? { active: true, lastAlert: wwProfile.lastWWSnapshot } : { active: false },
        ls: lsProfile ? { active: true, lastSnapshot: lsProfile.lastLSSnapshot } : { active: false },
      };
    });
  }
}

export const treasuryService = new TreasuryService();
