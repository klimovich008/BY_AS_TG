import puppeteer from "puppeteer";
import { connectToMongo } from "./dbInit";
import { notifyChatsWithNewSlot } from "./bot";

type Slot = {
  id: string;
  time: string;
};


type Data = {
  slots: Slot[]
}


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
      headers: {
        "x-api-token": "ec6aab37-f042-4f9d-baaf-bf8069124976",
      },
    }
  );

  return await responce.json() as Data;
};

const getSlotsAndDate = async (day: number) => {
  const date = generateDateForNDaysInTheFuture(day);
  const data = await getSlotsInfo(date);
  const slotsArr: Slot[] = data?.slots || [];

  const { slots } = await connectToMongo();

  for (const slot of slotsArr) {
    const slotInfo = `Date: ${date}, Time: ${slot.time} \n`;
    const exists = await slots.findOne({ info: slotInfo });

    if (!exists) {
      await slots.insertOne({ info: slotInfo });
      await notifyChatsWithNewSlot(slotInfo);
    }
  }
};

export const updateApostileInfo = async (days: number = 10) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ignoreDefaultArgs: ["--disable-extensions"],
  });
  const page = await browser.newPage();
  await page.goto("https://dkko.edu.gov.by/apostil");
  await page.setViewport({ width: 1080, height: 1024 });

  const { slots, meta } = await connectToMongo();
  await slots.deleteMany({});

  for (let i = 0; i < days; i++) {
    await getSlotsAndDate(i);
  }

  await meta.updateOne(
    { key: "lastUpdate" },
    { $set: { value: new Date().toISOString() } },
    { upsert: true }
  );

  await browser.close();
};
