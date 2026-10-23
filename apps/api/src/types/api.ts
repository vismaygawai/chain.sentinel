export interface RiskScanRequestBody {
  address: string;
}

export interface WhaleRegisterRequestBody {
  address: string;
}

export interface PositionRegisterRequestBody {
  address: string;
}

export interface AlertsQuery {
  address?: string;
}

export interface HealthQuery {
  address?: string;
}

export interface AtpRegisterRequestBody {
  agentName: string;
  treasuryAddress: string;
  initialTokenSupply?: number;
  policyProfile?: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
}

export interface ApiErrorResponse {
  error: string;
  statusCode: number;
  timestamp: string;
  details?: string;
}

export interface SystemMetricsResponse {
  uptime: number;
  alerts: {
    whaleTotal: number;
    liquidationTotal: number;
  };
  correlator: any;
  websocket: {
    connectedClients: number;
    replayBufferSize: number;
  };
  atp: {
    registered: boolean;
    agentId: string;
  };
}
