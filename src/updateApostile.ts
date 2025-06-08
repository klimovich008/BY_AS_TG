import puppeteer from "puppeteer-core";
import { db } from "./dbInit";
import { notifyChatsWithNewSlot } from "./bot";

type Slot = {
  id: string;
  time: string;
};

const generateDateForNDaysInTheFuture = (N: number) => {
  const date = new Date();
  date.setDate(date.getDate() + N);
  const isoDate = date.toISOString();

  return isoDate.substring(0, isoDate.indexOf("T"));
};

const getSlotsInfo = async (date: string) => {
  const responce = await fetch(
    "https://api.dkko.edu.gov.by/api/order-units/visits/slots?numberOfDocs=1&date=" +
      date,
    {
      headers: {
        "x-api-token": "ec6aab37-f042-4f9d-baaf-bf8069124976",
      },
    }
  );

  return await responce.json();
};

const getSlotsAndDate = async (day: number) => {
  const date = generateDateForNDaysInTheFuture(day);
  const data = await getSlotsInfo(date);
	// @ts-ignore
	const slots: Slot[] = data?.slots || [];

	const slotsDBInfo: Array<string> = db.get("slots") || [];

  slots.forEach((slot: Slot) => {
		slotsDBInfo.push(`Date: ${date}, Time: ${slot.time} \n`);
		const slotInfo = date + " " + slot.time;

		if(!db.has(slotInfo)) {
			db.set(slotInfo, true);
			notifyChatsWithNewSlot(slotInfo);
		}
  });

	db.set("lastUpdate", new Date().toISOString());``
	db.set("slots", slotsDBInfo);
};

export const updateApostileInfo = async (days: number = 10) => {
		// Launch the browser and open a new blank page
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

  // Navigate the page to a URL.
  await page.goto("https://dkko.edu.gov.by/apostil");
  await page.setViewport({ width: 1080, height: 1024 });

  for (let i = 0; i < days; i++) {
		db.delete("slots");
    getSlotsAndDate(i);
  }

  await browser.close();
};
