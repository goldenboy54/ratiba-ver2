import bcrypt from "bcrypt";
import pool from "../db.js";

const saltRounds = 10;

export const getUserByEmailSelf = async (email) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM users WHERE user_email = ?", [email]);
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        throw err;
    }
};

export const addSelfRegisteredUser = async (user) => {
    const { full_name, department, user_email, role, password, status } = user;

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const query = `
            INSERT INTO users (full_name, department, user_email, role, password, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [full_name, department, user_email, role, hashedPassword, status];
        await pool.execute(query, values);
    } catch (err) {
        throw err;
    }
};
