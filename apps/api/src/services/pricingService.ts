import { priceTools } from '../../../../packages/agents-core/src/index.ts';

export class PricingService {
  public async getPrice(symbol: string): Promise<number> {
    return priceTools.getTokenPriceUSD(symbol);
  }

  public async getPrices(symbols: string[]): Promise<Record<string, number>> {
    return priceTools.getBatchPrices(symbols);
  }
}

export const pricingService = new PricingService();
