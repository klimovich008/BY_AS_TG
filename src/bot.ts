import { Telegraf } from "telegraf";
import { db } from "./dbInit";

console.log("Bot is starting...");

export const bot = new Telegraf(process.env.BOT_TOKEN || "");
bot.start((ctx) => {
  ctx.reply("Привет! Я бот для отслеживания свободных слотов для апостиля.");
  const chats = db.get("chats") || [];

  if (!chats.includes(ctx.chat.id)) {
    chats.push(ctx.chat.id);
    db.set("chats", chats);
  }
});

bot.command("status", (ctx) => {
  const replyMessage = `
    Текущий статус бота:
    - Бот запущен и работает.
    - Количество чатов для уведомлений: ${db.get("chats")?.length || 0}
    - Последнее обновление слотов: ${db.get("lastUpdate") ? new Date(db.get("lastUpdate")).toLocaleString('en-US', { timeZoneName: 'short' }) : "неизвестно"}
    - Количество слотов: ${db.get("slots")?.length || 0}
    `;

  ctx.reply(replyMessage);
});
bot.command("slots", (ctx) =>
  ctx.reply(db.get("slots") || "Информация о слотах отсутвует.")
);

bot.launch();

export const notifyChatsWithNewSlot = (slots: string) => {
  const chats: Array<number> = db.get("chats") || [];

  chats.forEach((chatId) => {
    bot.telegram.sendMessage(chatId, `Новый слот для апостиля: ${slots}`);
  });
};

export const launchBot = async () => {
  console.log("Bot launched successfully.");
};

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
