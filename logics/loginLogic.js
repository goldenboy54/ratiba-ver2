import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { getUserByEmail } from "../models/loginModel.js";

export const anzishaPassport = (app) => {
    passport.use(new LocalStrategy(
        {
            usernameField: "username", // input field name
            passwordField: "password",
        },
        async (username, password, done) => {
            try {
                const user = await getUserByEmail(username);
                if (!user) {
                    return done(null, false, { message: "Incorrect email" });
                }
                const match = await bcrypt.compare(password, user.password);
                if (!match) return done(null, false, { message: "Incorrect password" });
                if (user.status !== "ACTIVE") return done(null, false, { message: "Account inactive" });
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, user.user_id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await getUserByEmailById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    app.use(passport.initialize());
    app.use(passport.session());
};

// Middleware to check authentication
export const anaruhusa = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
};

// Helper to get user by id
import pool from "../db.js";
export const getUserByEmailById = async (id) => {
    const [rows] = await pool.execute(
        "SELECT user_id, full_name, user_email, role, status FROM users WHERE user_id = ?",
        [id]
    );
    return rows[0] || null;
};
