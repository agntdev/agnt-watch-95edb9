import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getProfile, setProfile } from "../storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("summary:enable", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from!.id;
  const profile = getProfile(userId);
  const current = profile?.summaryTime ?? "Not set";
  await ctx.reply(
    `🌅 Morning summary\n\nCurrent time: ${current}\n\nSend a time in HH:MM format (e.g. 08:00).`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
  (ctx.session as Record<string, unknown>).step = "awaiting_summary_time";
});

composer.on("message:text", async (ctx, next) => {
  if ((ctx.session as Record<string, unknown>).step === "awaiting_summary_time") {
    (ctx.session as Record<string, unknown>).step = undefined;
    const time = ctx.message.text.trim();
    if (!/^\d{1,2}:\d{2}$/.test(time)) {
      await ctx.reply(
        "That doesn't look like a valid time. Use HH:MM format, e.g. 08:00.",
        { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
      );
      return;
    }
    const userId = ctx.from!.id;
    const profile = getProfile(userId) ?? { chatId: userId };
    profile.summaryTime = time;
    setProfile(userId, profile);
    await ctx.reply(
      `✅ Morning summary set for ${time}.`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }
  return next();
});

export default composer;
