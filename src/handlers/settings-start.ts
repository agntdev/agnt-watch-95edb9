import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getProfile, setProfile } from "../storage.js";

function settingsMessage(profile: { quietHoursStart?: string; quietHoursEnd?: string; defaultCooldownLength?: number } | undefined): string {
  const qh = profile?.quietHoursStart && profile?.quietHoursEnd
    ? `${profile.quietHoursStart}–${profile.quietHoursEnd}`
    : "Not set";
  const cd = profile?.defaultCooldownLength ?? 60;
  return `⚙️ Settings\n\nQuiet hours: ${qh}\nCooldown: ${cd} min`;
}

function settingsKeyboard(profile: { quietHoursStart?: string; quietHoursEnd?: string; defaultCooldownLength?: number } | undefined) {
  return inlineKeyboard([
    [inlineButton("🌙 Quiet hours", "settings:quiet_hours")],
    [inlineButton("⏱ Cooldown", "settings:cooldown")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
}

const composer = new Composer<Ctx>();

composer.callbackQuery("settings:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from!.id;
  const profile = getProfile(userId);
  await ctx.reply(settingsMessage(profile), {
    reply_markup: settingsKeyboard(profile),
  });
});

composer.callbackQuery("settings:quiet_hours", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from!.id;
  const profile = getProfile(userId);
  const current = profile?.quietHoursStart && profile?.quietHoursEnd
    ? `Currently: ${profile.quietHoursStart}–${profile.quietHoursEnd}`
    : "Not set yet.";
  await ctx.reply(
    `🌙 Quiet hours\n\n${current}\n\nSend two times in HH:MM format, one per line.\nExample:\n22:00\n08:00`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:start")]]) },
  );
  (ctx.session as Record<string, unknown>).step = "awaiting_quiet_hours";
});

composer.callbackQuery("settings:cooldown", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from!.id;
  const profile = getProfile(userId);
  const current = profile?.defaultCooldownLength ?? 60;
  await ctx.reply(
    `⏱ Cooldown between alerts\n\nCurrently: ${current} minutes\n\nSend a number in minutes (5–1440).`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:start")]]) },
  );
  (ctx.session as Record<string, unknown>).step = "awaiting_cooldown";
});

composer.on("message:text", async (ctx, next) => {
  const step = (ctx.session as Record<string, unknown>).step;

  if (step === "awaiting_quiet_hours") {
    (ctx.session as Record<string, unknown>).step = undefined;
    const lines = ctx.message.text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      await ctx.reply(
        "Need two times (start and end), one per line. Try again:",
        { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:start")]]) },
      );
      return;
    }
    const timeRe = /^\d{1,2}:\d{2}$/;
    if (!timeRe.test(lines[0]!) || !timeRe.test(lines[1]!)) {
      await ctx.reply(
        "Those don't look like valid times. Use HH:MM format, e.g. 22:00 and 08:00.",
        { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:start")]]) },
      );
      return;
    }
    const userId = ctx.from!.id;
    const profile = getProfile(userId) ?? { chatId: userId };
    profile.quietHoursStart = lines[0];
    profile.quietHoursEnd = lines[1];
    setProfile(userId, profile);
    await ctx.reply(
      `✅ Quiet hours set: ${lines[0]}–${lines[1]}`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:start")]]) },
    );
    return;
  }

  if (step === "awaiting_cooldown") {
    (ctx.session as Record<string, unknown>).step = undefined;
    const n = parseInt(ctx.message.text.trim(), 10);
    if (isNaN(n) || n < 5 || n > 1440) {
      await ctx.reply(
        "Pick a number between 5 and 1440 minutes.",
        { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:start")]]) },
      );
      return;
    }
    const userId = ctx.from!.id;
    const profile = getProfile(userId) ?? { chatId: userId };
    profile.defaultCooldownLength = n;
    setProfile(userId, profile);
    await ctx.reply(
      `✅ Cooldown set to ${n} minutes.`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:start")]]) },
    );
    return;
  }

  return next();
});

export default composer;
