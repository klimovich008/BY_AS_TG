import JSONdb from 'simple-json-db';
const DB_FILE = 'DB.json';

export const db = new JSONdb('DB_FILE');
console.log(`Using database file: ${DB_FILE}`);




