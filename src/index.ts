import cron from "node-cron";
import { updateApostileInfo } from "./updateApostile";
import { launchBot } from "./bot";
import { connectToMongo } from "./dbInit";

export const DAYS_TO_CHECK = Number(process.env.DAYS_TO_CHECK) || 30;

(async () => {
	await connectToMongo();
	await launchBot();

	cron.schedule("*/5 * * * *", () => {
		console.log("Running cron job to update apostile info...");
		updateApostileInfo(DAYS_TO_CHECK);
	});
})();
