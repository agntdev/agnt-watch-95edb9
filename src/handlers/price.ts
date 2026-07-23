import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getWatchlist } from "../storage.js";
import { getPriceForTicker, getPricesForTickers } from "../coingecko.js";

function formatPrice(n: number): string {
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toFixed(6);
}

const composer = new Composer<Ctx>();

composer.command("price", async (ctx) => {
  const text = ctx.message?.text ?? "";
  const arg = text.replace(/^\/price\s*/, "").trim().toUpperCase();
  if (arg) {
    const price = await getPriceForTicker(arg);
    if (!price) {
      await ctx.reply(`Couldn't find price for ${arg}. Check the ticker and try again.`, {
        reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
      });
      return;
    }
    const sign = price.change24h >= 0 ? "+" : "";
    await ctx.reply(
      `📊 ${price.symbol}\n$${formatPrice(price.priceUsd)} (${sign}${price.change24h.toFixed(1)}%)`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  const userId = ctx.from!.id;
  const entries = getWatchlist(userId);
  const tickers = entries.filter((e) => e.enabled).map((e) => e.ticker);

  if (tickers.length === 0) {
    await ctx.reply(
      "Your watchlist is empty — add some coins first.",
      { reply_markup: inlineKeyboard([[inlineButton("➕ Add Coin", "add_coin:start")]]) },
    );
    return;
  }

  const prices = await getPricesForTickers(tickers);
  const lines = ["📊 Prices:\n"];
  for (const t of tickers) {
    const p = prices.get(t);
    if (p) {
      const sign = p.change24h >= 0 ? "+" : "";
      lines.push(`• ${t} — $${formatPrice(p.priceUsd)} (${sign}${p.change24h.toFixed(1)}%)`);
    } else {
      lines.push(`• ${t} — price unavailable`);
    }
  }

  await ctx.reply(lines.join("\n"), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

composer.callbackQuery("price:check", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from!.id;
  const entries = getWatchlist(userId);
  const tickers = entries.filter((e) => e.enabled).map((e) => e.ticker);

  if (tickers.length === 0) {
    await ctx.reply(
      "Your watchlist is empty — add some coins first.",
      { reply_markup: inlineKeyboard([[inlineButton("➕ Add Coin", "add_coin:start")]]) },
    );
    return;
  }

  const prices = await getPricesForTickers(tickers);
  const lines = ["📊 Prices:\n"];
  for (const t of tickers) {
    const p = prices.get(t);
    if (p) {
      const sign = p.change24h >= 0 ? "+" : "";
      lines.push(`• ${t} — $${formatPrice(p.priceUsd)} (${sign}${p.change24h.toFixed(1)}%)`);
    } else {
      lines.push(`• ${t} — price unavailable`);
    }
  }

  await ctx.reply(lines.join("\n"), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
