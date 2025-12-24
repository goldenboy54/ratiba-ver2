import pool from "../db.js";
import bcrypt from "bcrypt";

const saltRounds = 10;

// Get user by ID
export const getUserById = async (id) => {
    if (!id) throw new Error("User ID is required");

    try {
        const [rows] = await pool.execute(
            "SELECT user_id, full_name, department, user_email, role, status FROM users WHERE user_id = ?",
            [id]
        );
        return rows[0] || null;
    } catch (err) {
        throw err;
    }
};

// Update user info
export const updateUserProfile = async (id, user) => {
    if (!id) throw new Error("User ID is required");

    try {
        const { full_name, department, user_email, password } = user;

        let query = "UPDATE users SET full_name = ?, department = ?, user_email = ?";
        const values = [full_name || null, department || null, user_email || null];

        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            query += ", password = ?, must_change_password = 0, last_password_change = NOW()";
            values.push(hashedPassword);
        }

        query += " WHERE user_id = ?";
        values.push(id);

        await pool.execute(query, values);
    } catch (err) {
        throw err;
    }
};


// Delete user by ID
export const deleteUserProfile = async (id) => {
    if (!id) throw new Error("User ID is required");

    try {
        await pool.execute("DELETE FROM users WHERE user_id = ?", [id]);
    } catch (err) {
        throw err;
    }
};
