const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const TICKER_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ADA: "cardano",
  XRP: "ripple",
  DOT: "polkadot",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  MATIC: "matic-network",
  SHIB: "shiba-inu",
  LTC: "litecoin",
  UNI: "uniswap",
  ATOM: "cosmos",
  NEAR: "near",
};

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
}

export async function searchCoin(
  query: string,
): Promise<Array<{ id: string; symbol: string; name: string }>> {
  const url = `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    coins?: Array<{ id: string; symbol: string; name: string }>;
  };
  return (data.coins ?? []).slice(0, 5);
}

export async function getPriceByIds(
  ids: string[],
): Promise<CoinPrice[]> {
  if (ids.length === 0) return [];
  const url = `${COINGECKO_BASE}/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as Record<
    string,
    { usd?: number; usd_24h_change?: number }
  >;
  return ids
    .filter((id) => data[id]?.usd !== undefined)
    .map((id) => ({
      id,
      symbol: id.toUpperCase(),
      name: id,
      priceUsd: data[id]!.usd!,
      change24h: data[id]!.usd_24h_change ?? 0,
    }));
}

export async function getPriceForTicker(
  ticker: string,
): Promise<CoinPrice | null> {
  const normalized = ticker.toUpperCase();
  const cgId = TICKER_TO_ID[normalized] ?? normalized.toLowerCase();
  const results = await getPriceByIds([cgId]);
  if (results.length === 0) {
    const matches = await searchCoin(normalized);
    if (matches.length === 0) return null;
    const fetched = await getPriceByIds([matches[0].id]);
    return fetched.length > 0 ? fetched[0]! : null;
  }
  results[0]!.symbol = normalized;
  return results[0]!;
}

export async function getPricesForTickers(
  tickers: string[],
): Promise<Map<string, CoinPrice>> {
  const ids = tickers.map(
    (t) => TICKER_TO_ID[t.toUpperCase()] ?? t.toLowerCase(),
  );
  const results = await getPriceByIds(ids);
  const map = new Map<string, CoinPrice>();
  for (let i = 0; i < tickers.length; i++) {
    const found = results.find((r) => r.id === ids[i]);
    if (found) {
      map.set(tickers[i]!.toUpperCase(), { ...found, symbol: tickers[i]!.toUpperCase() });
    }
  }
  return map;
}

export function resolveCoinId(ticker: string): string | null {
  const normalized = ticker.toUpperCase();
  return TICKER_TO_ID[normalized] ?? normalized.toLowerCase();
}

export function isKnownTicker(ticker: string): boolean {
  return ticker.toUpperCase() in TICKER_TO_ID;
}
