export interface UserProfile {
  chatId: number;
  timeZone?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  summaryTime?: string;
  defaultCooldownLength?: number;
}

export interface WatchlistEntry {
  ticker: string;
  coinId?: string;
  priceThresholdRule?: number;
  percentChangeRule?: number;
  enabled: boolean;
  lastAlertTimestamp?: number;
  lastAlertPrice?: number;
}

export interface AlertEvent {
  timestamp: number;
  userId: number;
  ticker: string;
  oldPrice: number;
  newPrice: number;
  percentChange: number;
  ruleType: string;
}

const profiles = new Map<number, UserProfile>();
const watchlists = new Map<number, WatchlistEntry[]>();
const alerts: AlertEvent[] = [];
const userIndex = new Map<number, Set<number>>();

export function getProfile(userId: number): UserProfile | undefined {
  return profiles.get(userId);
}

export function setProfile(userId: number, profile: UserProfile): void {
  profiles.set(userId, profile);
}

export function getWatchlist(userId: number): WatchlistEntry[] {
  return watchlists.get(userId) ?? [];
}

export function addWatchlistEntry(userId: number, entry: WatchlistEntry): void {
  const list = watchlists.get(userId) ?? [];
  const existing = list.findIndex((e) => e.ticker === entry.ticker);
  if (existing >= 0) {
    list[existing] = entry;
  } else {
    list.push(entry);
  }
  watchlists.set(userId, list);
}

export function removeWatchlistEntry(userId: number, ticker: string): boolean {
  const list = watchlists.get(userId);
  if (!list) return false;
  const idx = list.findIndex((e) => e.ticker === ticker);
  if (idx < 0) return false;
  list.splice(idx, 1);
  if (list.length === 0) watchlists.delete(userId);
  return true;
}

export function getWatchlistEntry(userId: number, ticker: string): WatchlistEntry | undefined {
  const list = watchlists.get(userId);
  return list?.find((e) => e.ticker === ticker);
}

export function recordAlert(event: AlertEvent): void {
  alerts.push(event);
  const idx = userIndex.get(event.userId) ?? new Set();
  idx.add(alerts.length - 1);
  userIndex.set(event.userId, idx);
}

export function getTotalUsers(): number {
  return profiles.size;
}

export function getTotalAlerts(): number {
  return alerts.length;
}

export function getTopTickers(limit = 10): Array<{ ticker: string; count: number }> {
  const counts = new Map<string, number>();
  for (const a of alerts) {
    counts.set(a.ticker, (counts.get(a.ticker) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([ticker, count]) => ({ ticker, count }));
}

export function resetAll(): void {
  profiles.clear();
  watchlists.clear();
  alerts.length = 0;
  userIndex.clear();
}
