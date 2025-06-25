import puppeteer from "puppeteer";
import { connectToMongo } from "./dbInit";
import { notifyChatsWithNewSlot } from "./bot";
import { slots } from "./mongoInit";

type Slot = {
  id: string;
  time: string;
};

type Data = {
  slots: Slot[];
};

const generateDateForNDaysInTheFuture = (N: number) => {
  const date = new Date();
  date.setDate(date.getDate() + N);
  const isoDate = date.toISOString();

  return isoDate.substring(0, isoDate.indexOf("T"));
};

const getSlotsInfo = async (date: string): Promise<Data> => {
  const responce = await fetch(
    "https://api.dkko.edu.gov.by/api/order-units/visits/slots?numberOfDocs=1&date=" +
      date,
    {
      signal: AbortSignal.timeout(600000),
      headers: {
        "x-api-token": "ec6aab37-f042-4f9d-baaf-bf8069124976",
      },
    }
  );

  return (await responce.json()) as Data;
};

const getSlotsAndDate = async (day: number) => {
  const date = generateDateForNDaysInTheFuture(day);
  const data = await getSlotsInfo(date);
  const slotsArr: Slot[] = data?.slots || [];

  const { slots } = await connectToMongo();

  let slotsToInsert = [];

  for (const slot of slotsArr) {
    const slotInfo = `Date: ${date}, Time: ${slot.time}`;
    const exists = await slots.findOne({ info: slotInfo });

    slotsToInsert.push(slotInfo);

    if (!exists) {
      await notifyChatsWithNewSlot(slotInfo);
    }
  }

  return slotsToInsert;
};

export const updateApostileInfo = async (days: number = 10) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ignoreDefaultArgs: ["--disable-extensions"],
  });
  const page = await browser.newPage();

  try {
    await page.goto("https://dkko.edu.gov.by/apostil", {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    await page.setViewport({ width: 1080, height: 1024 });

    const { meta } = await connectToMongo();

    const updatedSlots = [];

    for (let i = 0; i < days; i++) {
      updatedSlots.push(...(await getSlotsAndDate(i)));
    }

    await slots.deleteMany({});
    if (updatedSlots.length)
      await slots.insertMany(updatedSlots.map((info) => ({ info })));

    await meta.updateOne(
      { key: "lastUpdate" },
      { $set: { value: new Date().toISOString() } },
      { upsert: true }
    );
  } catch (error) {
    console.error("Error updating apostile info:", error);
    await browser.close();
  }
};
