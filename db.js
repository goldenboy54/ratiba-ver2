import mysql from "mysql2/promise";
import "dotenv/config";

const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  waitForConnections: true,
  connectionLimit: 20000,
  //connectionTimeout: 10000, // Increase timeout to 10 seconds
  queueLimit: 0,
});


export default pool;
