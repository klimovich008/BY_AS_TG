import cron from "node-cron";
import { updateApostileInfo } from "./updateApostile";
import { launchBot } from "./bot";

launchBot();

cron.schedule("* 5 * * *", () => {
	console.log("Running cron job to update apostile info...");
	updateApostileInfo(20);
});
