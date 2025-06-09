import { MongoClient, Db, Collection } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "apostile";

let client: MongoClient;
let db: Db;
let chats: Collection;
let slots: Collection;
let meta: Collection;

export const connectToMongo = async () => {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    chats = db.collection("chats");
    slots = db.collection("slots");
    meta = db.collection("meta");
  }
  return { db, chats, slots, meta };
};

export { client, db, chats, slots, meta };
