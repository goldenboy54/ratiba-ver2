import mysql from "mysql2/promise";
import "dotenv/config";

const pool = mysql.createPool({
  host: process.env.HOST,
  // support either env var name: DB_USER (this codebase's convention)
  // or USER (the production .env's convention), so either .env file works.
  user: process.env.DB_USER ?? process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  waitForConnections: true,
  connectionLimit: 20000,
  //connectionTimeout: 10000, // Increase timeout to 10 seconds
  queueLimit: 0,
});


export default pool;
