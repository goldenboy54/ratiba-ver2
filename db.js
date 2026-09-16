import mysql from "mysql2/promise";
import "dotenv/config";

const pool = mysql.createPool({
  // Support the names used by the current .env and the legacy deployment.
  host: process.env.DB_HOST ?? process.env.HOST ?? "localhost",
  user: process.env.DB_USER ?? process.env.USER,
  password: process.env.DB_PASSWORD ?? process.env.PASSWORD ?? "",
  database: process.env.DB_NAME ?? process.env.DATABASE,
  waitForConnections: true,
  connectionLimit: 20000,
  //connectionTimeout: 10000, // Increase timeout to 10 seconds
  queueLimit: 0,
});


export default pool;
