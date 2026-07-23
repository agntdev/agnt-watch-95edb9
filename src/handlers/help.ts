import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const HELP =
  "ℹ️ Crypto Watchlist Alerts\n\n" +
  "Track crypto prices and get alerts when thresholds are hit.\n\n" +
  "• Add coins to your watchlist\n" +
  "• Set price or % change alerts\n" +
  "• Check prices anytime\n" +
  "• Configure quiet hours & cooldowns\n\n" +
  "Tap /start to open the menu.";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("help", async (ctx) => {
  await ctx.reply(HELP);
});

composer.callbackQuery("menu:help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(HELP, { reply_markup: backToMenu });
});

export default composer;
