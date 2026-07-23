import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  inlineButton,
  inlineKeyboard,
  registerMainMenuItem,
} from "../toolkit/index.js";
import {
  getWatchlistEntry,
  addWatchlistEntry,
} from "../storage.js";
import { searchCoin, isKnownTicker, resolveCoinId } from "../coingecko.js";

const COMMON_COINS = [
  { label: "BTC", ticker: "BTC" },
  { label: "ETH", ticker: "ETH" },
  { label: "SOL", ticker: "SOL" },
  { label: "ADA", ticker: "ADA" },
  { label: "XRP", ticker: "XRP" },
  { label: "DOGE", ticker: "DOGE" },
];

function commonCoinKeyboard() {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < COMMON_COINS.length; i += 2) {
    const row = COMMON_COINS.slice(i, i + 2).map((c) =>
      inlineButton(c.label, `add_coin:pick:${c.ticker}`),
    );
    rows.push(row);
  }
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  return inlineKeyboard(rows);
}

function alertConfigKeyboard(ticker: string) {
  return inlineKeyboard([
    [inlineButton("📈 Set price alert", `alert:price:${ticker}`)],
    [inlineButton("📉 Set % change alert", `alert:pct:${ticker}`)],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
}

const composer = new Composer<Ctx>();

composer.callbackQuery("add_coin:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "Pick a coin below or type a ticker symbol:",
    { reply_markup: commonCoinKeyboard() },
  );
});

composer.callbackQuery(/^add_coin:pick:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1]!.toUpperCase();
  const userId = ctx.from!.id;

  const existing = getWatchlistEntry(userId, ticker);
  if (existing) {
    await ctx.reply(
      `${ticker} is already on your watchlist.`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  const coinId = resolveCoinId(ticker);
  addWatchlistEntry(userId, {
    ticker,
    coinId: coinId ?? ticker.toLowerCase(),
    enabled: true,
  });

  await ctx.reply(
    `✅ ${ticker} added to your watchlist.`,
    { reply_markup: alertConfigKeyboard(ticker) },
  );
});

composer.on("message:text", async (ctx, next) => {
  if ((ctx.session as Record<string, unknown>).step === "awaiting_coin_ticker") {
    (ctx.session as Record<string, unknown>).step = undefined;
    const raw = ctx.message.text.trim().toUpperCase();
    const ticker = raw.replace(/[^A-Z0-9]/g, "");

    if (ticker.length < 2 || ticker.length > 10) {
      await ctx.reply(
        "That doesn't look like a valid ticker. Try something like BTC or ETH.",
        { reply_markup: commonCoinKeyboard() },
      );
      return;
    }

    const userId = ctx.from!.id;
    const existing = getWatchlistEntry(userId, ticker);
    if (existing) {
      await ctx.reply(
        `${ticker} is already on your watchlist.`,
        { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
      );
      return;
    }

    const coinId = resolveCoinId(ticker);
    addWatchlistEntry(userId, {
      ticker,
      coinId: coinId ?? ticker.toLowerCase(),
      enabled: true,
    });

    await ctx.reply(
      `✅ ${ticker} added to your watchlist.`,
      { reply_markup: alertConfigKeyboard(ticker) },
    );
    return;
  }
  return next();
});

export default composer;
