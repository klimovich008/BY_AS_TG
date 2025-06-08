import cron from "node-cron";
import { updateApostileInfo } from "./updateApostile";
import { launchBot } from "./bot";

launchBot();

cron.schedule("* * * * *", () => {
	console.log("Running cron job to update apostile info...");
	updateApostileInfo(10);
});
