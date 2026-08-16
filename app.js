import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import {
  anzishaPassport,
  anaruhusa,
  routes_za_HOD,
  routes_za_TMASTER,
  routes_za_HOD_TMASTER,
} from "./middlewares/auth.js";

// Import route files
import programsRoutes from "./routes/programs.js";
import subjectsRoutes from "./routes/subjects.js";
import registered_subjectsRoutes from "./routes/registered_subjects.js";
import departmentsRoutes from "./routes/departments.js";
import venuesRoutes from "./routes/venues.js";
import usersRoutes from "./routes/users.js";
import timetablesRoutes from "./routes/timetables.js";
import searchTimetables from './routes/searchtimatable.js';
import viewtimetable from "./routes/viewtimetable.js";
import tmasterRoutes from "./routes/tmaster.js";
import work_reportsRoutes from "./routes/work_reports.js";
import selfRegisterRoutes from "./routes/selfRegisterRoutes.js";
import forgotPasswordRoutes from "./routes/forgotPasswordRoutes.js";
import userProfileRoutes from "./routes/userProfileRoutes.js";
import loginRoutes from "./routes/loginRoutes.js"; // new login routes
import forcePasswordChange from "./middlewares/forcePasswordChange.js";
// Routes for managing timetable
import manageTimetableRoutes from "./routes/manageTimetableRoutes.js";
import freedSlotsRoutes from "./routes/freedSlots.js";
//  Import route for freed slots
import fillFreedSlotsRoutes from "./routes/fillFreedSlotsRoutes.js";
import manualTimetableRoutes from "./routes/manualTimetableRoutes.js";
import collisionRoutes from "./routes/collisionMonitorRoutes.js";
import collisionReportRoutes from "./routes/collisionReportRoutes.js";
import venueManagerRoutes from "./routes/venueManagerRoutes.js";
import timetableDeletionLogRouter from './routes/timetable_deletion_logRoutes.js';
import viewTimetableByProgramCodeRouter from './routes/viewTimetableByProgramCodeRoute.js';

// Initialize dotenv
dotenv.config();

// Declare __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create express app
const app = express();
app.use(express.json());

// Set the port
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
}));

// Initialize Passport
anzishaPassport(app);

// Set view engine to EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Make user available in all templates
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// ======== ROUTES ======== //

// Home Route
app.get("/", (req, res) => {
    res.render("home");
});

// Use login routes
app.use(loginRoutes);

// Forgot Password Routes
app.use(forgotPasswordRoutes);

//colision monitor
app.use("/", collisionRoutes);
app.use("/", collisionReportRoutes);

// Self Register
app.use("/self-register", selfRegisterRoutes);

// User Profile
app.use("/profile", anaruhusa, userProfileRoutes);

// Programs, Subjects, Registered Subjects, Departments, Timetables (HOD)
app.use("/programs", anaruhusa,forcePasswordChange,  routes_za_HOD_TMASTER, programsRoutes);
app.use("/subjects", anaruhusa,forcePasswordChange,  routes_za_HOD_TMASTER, subjectsRoutes);
app.use("/registered_subjects", anaruhusa,forcePasswordChange,  routes_za_HOD_TMASTER, registered_subjectsRoutes);
app.use("/departments", anaruhusa,forcePasswordChange,  routes_za_HOD_TMASTER, departmentsRoutes);
app.use("/timetables", anaruhusa,forcePasswordChange,  routes_za_HOD_TMASTER, timetablesRoutes);

// Venues, Users, TMASTER, Work Reports (TMASTER)
app.use("/venues", anaruhusa,forcePasswordChange, routes_za_HOD_TMASTER, venuesRoutes);
app.use("/users", anaruhusa,forcePasswordChange, routes_za_HOD_TMASTER, usersRoutes);
app.use("/tmaster", anaruhusa,forcePasswordChange, routes_za_TMASTER, tmasterRoutes);
app.use("/work_reports", anaruhusa,forcePasswordChange, routes_za_TMASTER, work_reportsRoutes);
app.use("/manageTimetable", anaruhusa, forcePasswordChange, manageTimetableRoutes);
app.use("/manageTimetable/freed-slots", anaruhusa, forcePasswordChange, freedSlotsRoutes);
app.use("/fillFreedSlots", anaruhusa, forcePasswordChange, routes_za_HOD_TMASTER, fillFreedSlotsRoutes);
app.use("/manualTimetable", anaruhusa,forcePasswordChange, routes_za_TMASTER, manualTimetableRoutes);

app.use('/', viewTimetableByProgramCodeRouter);
app.use("/venueManager", anaruhusa, forcePasswordChange, venueManagerRoutes);

// Search & View Timetable
app.use('/searchtimetable', searchTimetables);
app.use('/', viewtimetable);
app.use('/timetable-deletion-logs', timetableDeletionLogRouter);

// Dashboard (protected)
app.get("/dashboard", anaruhusa, forcePasswordChange, (req, res) => {
    res.render("dashboard");
});

// TMASTER page (protected)
app.get("/tmaster", anaruhusa, forcePasswordChange, (req, res) => {
    res.render("tmaster");
});



// Logout Route
app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect("/login");
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
