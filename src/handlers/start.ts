import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  mainMenuKeyboard,
  registerMainMenuItem,
} from "../toolkit/index.js";

registerMainMenuItem({ label: "➕ Add Coin", data: "add_coin:start", order: 10 });
registerMainMenuItem({ label: "📋 View List", data: "view_watchlist", order: 20 });
registerMainMenuItem({ label: "⚙️ Settings", data: "settings:start", order: 30 });
registerMainMenuItem({ label: "📊 Price", data: "price:check", order: 40 });

const composer = new Composer<Ctx>();

const WELCOME = "👋 Welcome! Tap a button below to get started.";

composer.command("start", async (ctx) => {
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
