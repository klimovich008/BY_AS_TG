import cron from "node-cron";
import { updateApostileInfo } from "./updateApostile";

console.log(process.env.TG_TOKEN);

cron.schedule("* * * * *", () => {
	console.log("Running cron job to update apostile info...");
	updateApostileInfo(10);
});


