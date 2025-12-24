import pool from "../db.js";
import bcrypt from "bcrypt";

// Find user by email
export const findUserByEmail = async (email) => {
    const [rows] = await pool.execute(
        "SELECT * FROM users WHERE user_email = ? LIMIT 1", 
        [email]
    );
    return rows[0];
};

// Save password reset token
export const savePasswordResetToken = async (userId, token, expiry) => {
    await pool.execute(
        "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?",
        [token, expiry, userId]
    );
};

// Find user by reset token
export const findUserByResetToken = async (token) => {
    const [rows] = await pool.execute(
        "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() LIMIT 1",
        [token]
    );
    return rows[0];
};

// Update password
export const updatePassword = async (userId, newPassword) => {
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.execute(
        "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?",
        [hashed, userId]
    );
};
