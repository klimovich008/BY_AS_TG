import { Telegraf } from "telegraf";
import { connectToMongo } from "./dbInit";
import { DAYS_TO_CHECK } from ".";

console.log("Bot is starting...");

export const bot = new Telegraf(process.env.BOT_TOKEN || "");
bot.start(async (ctx) => {
  ctx.reply("Привет! Я бот для отслеживания свободных слотов для апостиля.", {
    reply_markup: {
      keyboard: [
        [{ text: "/status" }, { text: "/slots" }],
        [{ text: "/help" }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
  const { chats } = await connectToMongo();
  const chatId = ctx.chat.id;
  const exists = await chats.findOne({ chatId });
  if (!exists) {
    await chats.insertOne({ chatId });
  }
});

bot.command("status", async (ctx) => {
  const { chats, meta, slots } = await connectToMongo();
  const chatCount = await chats.countDocuments();
  const lastUpdateDoc = await meta.findOne({ key: "lastUpdate" });
  const lastUpdate = lastUpdateDoc?.value;
  const slotCount = await slots.countDocuments();

  const replyMessage = `
    Текущий статус бота:
    - Бот запущен и работает.
    - Количество дней для проверки слотов: ${DAYS_TO_CHECK}
    - Количество чатов для уведомлений: ${chatCount}
    - Последнее обновление слотов: ${
      lastUpdate
        ? new Date(lastUpdate).toLocaleString("en-US", {
            timeZoneName: "short",
          })
        : "неизвестно"
    }
    - Количество слотов: ${slotCount}
    `;
  ctx.reply(replyMessage);
});

bot.command("slots", async (ctx) => {
  const { slots } = await connectToMongo();
  const slotDocs = await slots.find().toArray();
  if (slotDocs.length === 0) {
    ctx.reply("Информация о слотах отсутвует.");
  } else {
    ctx.reply(slotDocs.map((s) => s.info).join("\n"));
  }
});

bot.hears("/help", (ctx) =>
  ctx.reply(
    [
      "Доступные команды:",
      "/status — статус бота",
      "/slots — показать слоты",
      "/help — показать это сообщение",
    ].join("\n")
  )
);

bot.launch();

export const notifyChatsWithNewSlot = async (slotInfo: string) => {
  const { chats } = await connectToMongo();
  const chatDocs = await chats.find().toArray();

  for (const chat of chatDocs) {
    try {
      await bot.telegram.sendMessage(
        chat.chatId,
        `Новый слот для апостиля: ${slotInfo}`
      );
    } catch (error) {
      console.error(`Failed to send message to chat ${chat.chatId}:`, error);
    }
  }
};

export const launchBot = async () => {
  console.log("Bot launched successfully.");
};

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
