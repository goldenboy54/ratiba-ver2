import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import session from "express-session";
import pool from "../db.js";

// Initialize Passport and Session
export const anzishaPassport = (app) => {
  app.use(
    session({
      secret: process.env.SESSION_KEY || "secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "username", passwordField: "password" },
      async (username, password, done) => {
        try {
          const [rows] = await pool.execute(
            "SELECT * FROM users WHERE user_email = ? AND status = 'active' AND role IN ('admin', 'tmaster', 'hod')",
            [username]
          );

          if (!rows[0]) return done(null, false, { message: "User not found or inactive" });

          const user = rows[0];
          const match = await bcrypt.compare(password, user.password);
          if (!match) return done(null, false, { message: "Invalid password" });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Use user_id for session
  passport.serializeUser((user, done) => {
    done(null, user.user_id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM users WHERE user_id = ? AND status = 'active' AND role IN ('admin', 'tmaster', 'hod')", [id]);
      if (!rows[0]) return done(new Error("User not found"));
      done(null, rows[0]);
    } catch (err) {
      done(err);
    }
  });
};

// Middleware to check if user is authenticated
export const anaruhusa = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

// Middleware to restrict routes to HOD/Admin
export const routes_za_HOD = (req, res, next) => {
  if (req.user && (req.user.role === "hod" || req.user.role === "admin")) {
    return next();
  }
  res.status(403).send("Unauthorized");
};

// Middleware to restrict routes to HOD/Admin/tmaster
export const routes_za_HOD_TMASTER = (req, res, next) => {
  if (req.user && (req.user.role === "hod" || req.user.role === "admin" || req.user.role === "tmaster")) {
    return next();
  }
  res.status(403).send("Unauthorized");
};
// Middleware to restrict routes to TMASTER
export const routes_za_TMASTER = (req, res, next) => {
  if (req.user && req.user.role === "tmaster" || req.user.role === "admin") {
    return next();
  }
  res.status(403).send("Unauthorized");
};
