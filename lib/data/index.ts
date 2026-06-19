import type { MarketDataProvider } from "@/lib/data/types";
import { MockMarketDataProvider } from "@/lib/data/providers/mock";
import { FMPMarketDataProvider } from "@/lib/data/providers/fmp";
import { AlphaVantageProvider } from "@/lib/data/providers/alpha-vantage";

let _provider: MarketDataProvider | null = null;

export function marketData(): MarketDataProvider {
  if (_provider) return _provider;
  switch ((process.env.MARKET_DATA_PROVIDER ?? "mock").toLowerCase()) {
    case "fmp":
      _provider = new FMPMarketDataProvider();
      break;
    case "alphavantage":
      _provider = new AlphaVantageProvider();
      break;
    default:
      _provider = new MockMarketDataProvider();
  }
  return _provider;
}

export type { MarketDataProvider } from "@/lib/data/types";
