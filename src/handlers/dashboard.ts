import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getTotalUsers, getTotalAlerts, getTopTickers } from "../storage.js";

const OWNER_CHAT_ID = Number(process.env.OWNER_CHAT_ID ?? 0);

const composer = new Composer<Ctx>();

composer.command("dashboard", async (ctx) => {
  if (OWNER_CHAT_ID && ctx.from?.id !== OWNER_CHAT_ID) {
    await ctx.reply("This command is only available to the bot owner.");
    return;
  }

  const totalUsers = getTotalUsers();
  const totalAlerts = getTotalAlerts();
  const topTickers = getTopTickers(10);

  const lines = [
    "📊 Owner Dashboard\n",
    `Total users: ${totalUsers}`,
    `Total alerts fired: ${totalAlerts}`,
  ];

  if (topTickers.length > 0) {
    lines.push("\nTop tickers by alerts:");
    for (const t of topTickers) {
      lines.push(`• ${t.ticker}: ${t.count}`);
    }
  } else {
    lines.push("\nNo alerts fired yet.");
  }

  await ctx.reply(lines.join("\n"), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
