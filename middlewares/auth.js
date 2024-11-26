import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import session from "express-session";
import pool from "../db.js";

export const anzishaPassport = (app) => {
  app.use(
    session({
      secret: process.env.SESSION_KEY,
      resave: false,
      saveUninitialized: true,
      cookie: { maxAge: 600 * 1000 },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async function verify(username, password, cb) {
      try {
        const dbquery = "SELECT * FROM users WHERE user_email = ?";
        const valuesArray = [username];
        const [matokeoYaQuery] = await pool.execute(dbquery, valuesArray);
        if (matokeoYaQuery.length > 0) {
          const user = matokeoYaQuery[0];
          const storedHashedPassword = user.password;
          // Verify the password
          bcrypt.compare(password, storedHashedPassword, (err, result) => {
            if (err) {
              return cb(err);
            } else {
              if (result) {
                return cb(null, user);
              } else {
                return cb(null, false);
              }
            }
          });
        } else {
          return cb(null, false, { message: "User not found" });
        }
      } catch (err) {
        console.log(err);
        return cb(err);
      }
    })
  );
  passport.serializeUser((user, cb) => {
    cb(null, user.user_email);
  });

  passport.deserializeUser(async (email, cb) => {
    try {
      const dbquery = "SELECT * FROM users WHERE user_email = ?";
      const valuesArray = [email];
      const [matokeoYaQuery] = await pool.execute(dbquery, valuesArray);
      if (matokeoYaQuery.length > 0) {
        cb(null, matokeoYaQuery[0]);
      } else {
        cb(new Error("User not found"));
      }
    } catch (err) {
      cb(err);
    }
  });
};
export const anaruhusa = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
};

export const routes_za_HOD = (req, res, next) => {
  if (req.user && req.user.role === "hod") {
    return next();
  } else {
    res.status(403).send("Unauthorized");
  }
};
export const routes_za_TMASTER = (req, res, next) => {
  if (req.user && req.user.role === "tmaster") {
    return next();
  } else {
    res.status(403).send("Unauthorized");
  }
};
