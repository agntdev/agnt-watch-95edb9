import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getWatchlistEntry, addWatchlistEntry } from "../storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery(/^alert:config:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1]!.toUpperCase();
  const userId = ctx.from!.id;
  const entry = getWatchlistEntry(userId, ticker);

  if (!entry) {
    await ctx.reply(`${ticker} isn't on your watchlist.`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const lines = [`⚙️ Alerts for ${ticker}\n`];
  lines.push(`Price alert: ${entry.priceThresholdRule ? `$${entry.priceThresholdRule}` : "Not set"}`);
  lines.push(`% change alert: ${entry.percentChangeRule ? `${entry.percentChangeRule}%` : "Not set"}`);

  await ctx.reply(lines.join("\n"), {
    reply_markup: inlineKeyboard([
      [inlineButton("📈 Set price alert", `alert:price:${ticker}`)],
      [inlineButton("📉 Set % change alert", `alert:pct:${ticker}`)],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery(/^alert:price:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1]!.toUpperCase();
  await ctx.reply(
    `📈 Price alert for ${ticker}\n\nSend a USD price threshold (e.g. 50000).`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Cancel", `alert:config:${ticker}`)]]) },
  );
  (ctx.session as Record<string, unknown>).step = "awaiting_price_threshold";
  (ctx.session as Record<string, unknown>).coinTicker = ticker;
});

composer.callbackQuery(/^alert:pct:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1]!.toUpperCase();
  await ctx.reply(
    `📉 % change alert for ${ticker}\n\nSend a percent change threshold (e.g. 5 for ±5%).`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Cancel", `alert:config:${ticker}`)]]) },
  );
  (ctx.session as Record<string, unknown>).step = "awaiting_percent_change";
  (ctx.session as Record<string, unknown>).coinTicker = ticker;
});

composer.on("message:text", async (ctx, next) => {
  const step = (ctx.session as Record<string, unknown>).step;
  const ticker = (ctx.session as Record<string, unknown>).coinTicker as string | undefined;

  if (step === "awaiting_price_threshold" && ticker) {
    (ctx.session as Record<string, unknown>).step = undefined;
    (ctx.session as Record<string, unknown>).coinTicker = undefined;
    const n = parseFloat(ctx.message.text.trim());
    if (isNaN(n) || n <= 0) {
      await ctx.reply(
        "Please enter a valid price (e.g. 50000).",
        { reply_markup: inlineKeyboard([[inlineButton("⬅️ Cancel", `alert:config:${ticker}`)]]) },
      );
      return;
    }
    const userId = ctx.from!.id;
    const existing = getWatchlistEntry(userId, ticker);
    if (existing) {
      existing.priceThresholdRule = n;
      addWatchlistEntry(userId, existing);
    }
    await ctx.reply(
      `✅ Price alert set: notify when ${ticker} goes above $${n.toLocaleString()}.`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  if (step === "awaiting_percent_change" && ticker) {
    (ctx.session as Record<string, unknown>).step = undefined;
    (ctx.session as Record<string, unknown>).coinTicker = undefined;
    const n = parseFloat(ctx.message.text.trim());
    if (isNaN(n) || n <= 0 || n > 100) {
      await ctx.reply(
        "Please enter a valid percent (1–100).",
        { reply_markup: inlineKeyboard([[inlineButton("⬅️ Cancel", `alert:config:${ticker}`)]]) },
      );
      return;
    }
    const userId = ctx.from!.id;
    const existing = getWatchlistEntry(userId, ticker);
    if (existing) {
      existing.percentChangeRule = n;
      addWatchlistEntry(userId, existing);
    }
    await ctx.reply(
      `✅ % change alert set: notify when ${ticker} moves ±${n}%.`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  return next();
});

export default composer;
