import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { 
    findUserByEmail, 
    savePasswordResetToken, 
    findUserByResetToken, 
    updatePassword 
} from "../models/forgotPasswordModel.js";

// Load env variables
dotenv.config();

// Show forgot password form
export const showForgotPasswordForm = (req, res) => {
    res.render("forgotPassword", { error: null, success: null });
};

// Handle forgot password
export const handleForgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await findUserByEmail(email);
        if (!user) {
            return res.render("forgotPassword", { error: "No account found with that email.", success: null });
        }

        // Create secure reset token
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        // FIXED: use user.user_id instead of user.id
        await savePasswordResetToken(user.user_id, token, expiry);

        const resetLink = `${req.protocol}://${req.get("host")}/reset-password/${token}`;

        // Nodemailer transporter using .env settings
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: false, // TLS false for port 587
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            },
            // tls: {
            //     ciphers: "SSLv3"
            // }
     tls: {
        rejectUnauthorized: false // ADD THIS to accept self-signed certs
    }
        });

        await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: email,
            subject: "Password Reset Request",
            html: `
                <p>You requested a password reset.</p>
                <p>Click this link to reset your password: 
                <a href="${resetLink}" target="_blank">${resetLink}</a></p>
                <p>This link will expire in 1 hour.</p>
            `
        });

        res.render("forgotPassword", { error: null, success: "Password reset link sent to your email." });

    } catch (err) {
        res.render("forgotPassword", { error: "Error sending reset link: " + err.message, success: null });
    }
};

// Show reset password form
export const showResetPasswordForm = async (req, res) => {
    const token = req.params.token;
    try {
        const user = await findUserByResetToken(token);
        if (!user) {
            return res.send("Invalid or expired token.");
        }
        res.render("resetPassword", { token, error: null, success: null });
    } catch (err) {
        res.send("Error loading reset form.");
    }
};

// Handle reset password
export const handleResetPassword = async (req, res) => {
    const { token, password } = req.body;
    try {
        const user = await findUserByResetToken(token);
        if (!user) {
            return res.render("resetPassword", { token, error: "Invalid or expired token.", success: null });
        }

        // FIXED: use user.user_id instead of user.id
        await updatePassword(user.user_id, password);

        res.render("resetPassword", { token: null, error: null, success: "Password reset successfully! You can now log in." });
    } catch (err) {
        res.render("resetPassword", { token, error: "Error resetting password: " + err.message, success: null });
    }
};
