# Chain Sentinel — API & WebSocket Specifications

The Chain Sentinel backend service (`apps/api`) exposes high-performance REST endpoints and a real-time WebSocket event feed powered by Fastify.

Default Base URL: `http://localhost:3001`  
WebSocket Stream: `ws://localhost:3001/ws`

---

## 1. REST Endpoints

### 1.1 Treasury Risk Scan
Performs full multi-agent risk analysis, mitigation planning, and governance arbitration for an address.

- **URL**: `POST /api/risk-scan`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "snapshot": {
      "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "totalUsdValue": 18450200.50,
      "positions": [
        { "token": "ETH", "balance": 4850.2, "usdValue": 13823070.0 },
        { "token": "USDT", "balance": 2500000.0, "usdValue": 2500000.0 }
      ]
    },
    "risk": {
      "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "level": "LOW",
      "score": 18,
      "tier": "SAFE",
      "healthFactor": 2.85,
      "narrative": "Well-diversified treasury reserves.",
      "issues": []
    },
    "plan": {
      "actions": [
        { "type": "ALERT", "message": "Automated surveillance active." }
      ]
    },
    "decision": {
      "approved": true,
      "reason": "Low systemic risk profile.",
      "enforcedActions": [
        { "type": "ALERT", "message": "Automated surveillance active." }
      ]
    }
  }
  ```

---

### 1.2 WhaleWatch Registration
Registers an EVM wallet address for mempool transaction monitoring.

- **URL**: `POST /whale`
- **Request Body**:
  ```json
  {
    "address": "0x577da75775b0606b5d92582b1c67e9154b7c62c3"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "registered",
    "address": "0x577da75775b0606b5d92582b1c67e9154b7c62c3",
    "service": "WhaleWatch",
    "message": "Wallet successfully registered for WhaleWatch mempool monitoring."
  }
  ```

---

### 1.3 LiquidShield Position Registration
Registers a lending address for continuous Aave V3 health factor surveillance.

- **URL**: `POST /position`
- **Request Body**:
  ```json
  {
    "address": "0x577da75775b0606b5d92582b1c67e9154b7c62c3"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "registered",
    "address": "0x577da75775b0606b5d92582b1c67e9154b7c62c3",
    "service": "LiquidShield",
    "message": "Position successfully registered for LiquidShield Aave monitoring."
  }
  ```

---

### 1.4 Active Alerts & Correlation
Retrieves historical alerts and correlator window statistics.

- **URL**: `GET /alerts`
- **Query Parameters**:
  - `address` (optional): Filter alerts by monitored wallet address
- **Response (200 OK)**:
  ```json
  {
    "totalAlerts": 12,
    "windowStats": {
      "activeWhaleEvents": 4,
      "activeLiquidationRisks": 2,
      "correlatedCompoundCount": 1
    }
  }
  ```

---

### 1.5 System Metrics & Liveness
- `GET /healthz` — Service health and persistent database connection status.
- `GET /ready` — Service readiness check.
- `GET /metrics` — Uptime, memory usage, connected WebSocket client count, and correlator telemetry.

---

## 2. ATP (Agent Tokenization Platform) Endpoints

- `GET /api/atp/status` — Reports ATP connection and agent status.
- `GET /api/atp/metadata` — Returns published agent capabilities, token symbol (`cSNT`), and version.
- `POST /api/atp/register` — Registers new tokenized agent deployment instance.

---

## 3. WebSocket Real-Time Event Protocol

Connect to `ws://localhost:3001/ws` to receive instant on-chain threat streams.

### Stream Payloads:

#### Compound Threat Alert:
```json
{
  "type": "COMPOUND_ALERT",
  "data": {
    "walletAddress": "0x577da75775b0606b5d92582b1c67e9154b7c62c3",
    "isCorrelated": true,
    "combinedUrgency": "CRITICAL",
    "wwAlert": {
      "amount": "1500000",
      "token": "USDC",
      "txHash": "0x9f1a...48b2"
    },
    "lsAlert": {
      "healthFactor": "1.14",
      "collateral": "9420000",
      "debt": "5200000"
    }
  }
}
```
