import cron from "node-cron";
import { updateApostileInfo } from "./updateApostile";
import { Telegraf } from "telegraf";
import { db } from "./dbInit";


const bot = new Telegraf(process.env.BOT_TOKEN || '');
bot.start((ctx) => {ctx.reply('Привет! Я бот для отслеживания свободных слотов для апостиля.')
	const chats = db.get("chats") || [];

	if (!chats.includes(ctx.chat.id)) {
		chats.push(ctx.chat.id);
		db.set("chats", chats);
	}
})

bot.command('status', (ctx) => ctx.reply(db.get("lastUpdate") || "Информация о последнем обновлении отсутствует."));

bot.launch()


cron.schedule("* * * * *", () => {
	console.log("Running cron job to update apostile info...");
	updateApostileInfo(10);
	

	const chats: Array<number> = db.get("chats") || [];

	chats.forEach(chatId => {
		bot.telegram.sendMessage(chatId, "Проверка свободных слотов для апостиля выполнена. Проверьте наличие новых слотов.");
	});
});


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))