import puppeteer from "puppeteer";
import { db } from "./dbInit";

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
	const slots: Slot[] = data?.slots || [];

  slots.forEach((slot: Slot) => {
    console.log(`Date: ${date}, Time: ${slot.time}`);

		const slotInfo = date + " " + slot.time;

		if(!db.has(slotInfo)) {
			db.set(slotInfo, true);
			console.log(`New slot found: ${slotInfo}`);
		}
  });
};

export const updateApostileInfo = async (days: number = 10) => {
		// Launch the browser and open a new blank page
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

  // Navigate the page to a URL.
  await page.goto("https://dkko.edu.gov.by/apostil");
  await page.setViewport({ width: 1080, height: 1024 });

  for (let i = 0; i < days; i++) {
    getSlotsAndDate(i);
  }

  await browser.close();
};
