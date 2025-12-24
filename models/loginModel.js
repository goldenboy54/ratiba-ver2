import pool from "../db.js";
import bcrypt from "bcrypt";

// Get user by email
export const getUserByEmail = async (email) => {
    try {
        const [rows] = await pool.execute(
            "SELECT user_id, full_name, user_email, password, role, status FROM users WHERE user_email = ?",
            [email]
        );
        return rows[0] || null;
    } catch (err) {
        throw err;
    }
};
