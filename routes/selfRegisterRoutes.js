import express from "express";
import { showSelfRegisterForm, handleSelfRegister } from "../logics/selfRegisterLogic.js";

const router = express.Router();

// Show self-registration form
router.get("/", showSelfRegisterForm);

// Handle form submission
router.post("/", handleSelfRegister);

export default router;
