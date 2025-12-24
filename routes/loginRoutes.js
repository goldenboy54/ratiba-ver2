import express from "express";
import passport from "passport";

const router = express.Router();

// Show login form
router.get("/login", (req, res) => {
    res.render("login", { message: req.query.error || null });
});

// Handle login
router.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login?error=Invalid credentials or temporary unauthorized access will be active later ,,,",
        failureFlash: false
    }),
    (req, res) => {
        res.redirect("/dashboard");
    }
);

// Logout
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect("/login");
    });
});

export default router;
