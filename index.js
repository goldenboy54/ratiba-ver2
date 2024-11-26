// index.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import passport from "passport";
import {
  anzishaPassport,
  anaruhusa,
  routes_za_HOD,
  routes_za_TMASTER,
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
import  viewtimetable from "./routes/viewtimetable.js";
import  tmasterRoutes from "./routes/tmaster.js";

//import searchRouter from './routes/searchtimetable.js';
// Initialize dotenv
dotenv.config();

// Declare __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an express application
const app = express();
app.use(express.json());
// Set the port
const PORT = process.env.PORT || 3002;

// Middleware to parse incoming requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Initialize Passport
anzishaPassport(app);

// Set view engine to EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Home Route
app.get("/", (req, res) => {
  res.render("home");
});

// Login Routes
app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (req, res) => {
    res.render("index");
  }
);

// Logout Route
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});


// Programs, Subjects, Program_Venue, User_Subjects routes za HOD
//app.use("/programs", anaruhusa, routes_za_HOD,  programsRoutes);
app.use("/programs", anaruhusa, routes_za_TMASTER,  programsRoutes);
app.use("/subjects", anaruhusa,  subjectsRoutes);
app.use("/registered_subjects", anaruhusa,  registered_subjectsRoutes);
app.use("/departments", anaruhusa,  departmentsRoutes);
app.use("/timetables", anaruhusa, timetablesRoutes);

// Venues, Users, Schedule routes za TMASTER
app.use("/venues", anaruhusa, routes_za_TMASTER, venuesRoutes);
app.use("/users", anaruhusa, routes_za_TMASTER, usersRoutes);
app.use("/tmaster", anaruhusa, routes_za_TMASTER, tmasterRoutes);


// Routes
app.use('/timetables',anaruhusa, timetablesRoutes);

// Routes
app.use('/searchtimetable',anaruhusa,searchTimetables);
app.use('/',viewtimetable);

// Use routes
//app.use('/', searchRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
