import express from "express";
import {
  showProfile,
  handleProfileUpdate,
  handleProfileDelete
} from "../logics/userProfileLogic.js";

const router = express.Router();

// Route for viewing profile
router.get("/", showProfile);

// Route for editing profile (used by forcePasswordChange)
router.get("/edit", showProfile);  // reuse the same logic, or create separate logic if needed

// Handle profile update
router.post("/update", handleProfileUpdate);

// Handle profile deletion
router.post("/delete", handleProfileDelete);

export default router;
