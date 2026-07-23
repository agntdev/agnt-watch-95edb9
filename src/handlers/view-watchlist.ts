import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getWatchlist, removeWatchlistEntry } from "../storage.js";
import { getPricesForTickers } from "../coingecko.js";

function watchlistMessage(tickers: string[], prices: Map<string, { priceUsd: number; change24h: number }>): string {
  if (tickers.length === 0) {
    return "Your watchlist is empty — tap ➕ Add Coin to start tracking.";
  }
  const lines = ["📋 Your watchlist:\n"];
  for (const t of tickers) {
    const p = prices.get(t);
    if (p) {
      const sign = p.change24h >= 0 ? "+" : "";
      lines.push(`• ${t} — $${formatPrice(p.priceUsd)} (${sign}${p.change24h.toFixed(1)}%)`);
    } else {
      lines.push(`• ${t} — price unavailable`);
    }
  }
  return lines.join("\n");
}

function formatPrice(n: number): string {
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toFixed(6);
}

function watchlistKeyboard(tickers: string[]) {
  const rows: Array<Array<ReturnType<typeof inlineButton>>> = [];
  for (const t of tickers) {
    rows.push([
      inlineButton(`⚙️ ${t}`, `alert:config:${t}`),
      inlineButton(`🗑 Remove`, `watchlist:remove:${t}`),
    ]);
  }
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  return inlineKeyboard(rows);
}

const composer = new Composer<Ctx>();

composer.callbackQuery("view_watchlist", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from!.id;
  const entries = getWatchlist(userId);
  const tickers = entries.filter((e) => e.enabled).map((e) => e.ticker);

  let prices = new Map<string, { priceUsd: number; change24h: number }>();
  if (tickers.length > 0) {
    try {
      prices = await getPricesForTickers(tickers);
    } catch {
      // price feed failure — show list without prices
    }
  }

  const text = watchlistMessage(tickers, prices);
  const kb = watchlistKeyboard(tickers);
  await ctx.reply(text, { reply_markup: kb });
});

composer.callbackQuery(/^watchlist:remove:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1]!.toUpperCase();
  const userId = ctx.from!.id;
  const removed = removeWatchlistEntry(userId, ticker);

  if (removed) {
    await ctx.reply(`🗑 ${ticker} removed from your watchlist.`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  } else {
    await ctx.reply(`${ticker} wasn't on your watchlist.`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  }
});

export default composer;
