export interface SecurityIncident {
  id: string;
  protocol: string;
  type: 'FLASH_LOAN' | 'ORACLE_MANIPULATION' | 'LIQUIDATION_CASCADE' | 'REENTRANCY' | 'BRIDGE_EXPLOIT' | 'UNUSUAL_WHALE';
  description: string;
  vector: number[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedMitigation: string;
  timestamp: number;
}

export interface SimilarityMatch {
  incident: SecurityIncident;
  similarity: number;
}

/**
 * Calculates cosine similarity between two numerical vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Deterministic bag-of-words / character n-gram feature vectorizer
 * Allows similarity querying without requiring external vector database services
 */
export function pseudoEmbedText(text: string, dimensions: number = 32): number[] {
  const vector = new Array(dimensions).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;
  }

  // Normalize vector to unit length
  const mag = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));
  if (mag > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= mag;
    }
  }
  return vector;
}

export class ThreatVectorStore {
  private store: Map<string, SecurityIncident> = new Map();

  constructor() {
    this.seedKnownSignatures();
  }

  /**
   * Seed store with known DeFi exploit signatures
   */
  private seedKnownSignatures() {
    const defaultSignatures = [
      {
        id: 'SIG-001',
        protocol: 'Aave V3',
        type: 'LIQUIDATION_CASCADE' as const,
        description: 'Health factor rapid collapse below 1.05 triggered by collateral price drop and unhedged debt position',
        severity: 'CRITICAL' as const,
        recommendedMitigation: 'Execute immediate debt repayment or post top-up collateral within next block',
      },
      {
        id: 'SIG-002',
        protocol: 'Uniswap / Curve',
        type: 'ORACLE_MANIPULATION' as const,
        description: 'Flash loan borrowed 50M USDC to manipulate spot pool price and exploit lending valuation oracle',
        severity: 'CRITICAL' as const,
        recommendedMitigation: 'Pause affected collateral borrowing and enforce TWAP median filtering',
      },
      {
        id: 'SIG-003',
        protocol: 'Whale Movements',
        type: 'UNUSUAL_WHALE' as const,
        description: 'Large dormant whale wallet withdrew over 10M USDT and bridged to privacy mixer',
        severity: 'HIGH' as const,
        recommendedMitigation: 'Alert security operations center and increase liquidation vigilance on connected pools',
      },
      {
        id: 'SIG-004',
        protocol: 'DAO Treasury',
        type: 'FLASH_LOAN' as const,
        description: 'Single asset concentration exceeds 80% with large exposure to volatile altcoin token',
        severity: 'HIGH' as const,
        recommendedMitigation: 'Enforce DAO treasury diversification into stablecoins and blue-chip collateral',
      },
    ];

    for (const sig of defaultSignatures) {
      this.insert({
        ...sig,
        vector: pseudoEmbedText(sig.description),
        timestamp: Date.now(),
      });
    }
  }

  public insert(incident: SecurityIncident): void {
    this.store.set(incident.id, incident);
  }

  /**
   * Find most similar known security threats given a description
   */
  public querySimilar(queryText: string, topK: number = 3): SimilarityMatch[] {
    const queryVector = pseudoEmbedText(queryText);
    const matches: SimilarityMatch[] = [];

    for (const incident of this.store.values()) {
      const sim = cosineSimilarity(queryVector, incident.vector);
      matches.push({ incident, similarity: sim });
    }

    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.slice(0, topK);
  }

  public count(): number {
    return this.store.size;
  }
}

export const threatVectorStore = new ThreatVectorStore();
