import express from "express";
import { 
    showForgotPasswordForm, 
    handleForgotPassword, 
    showResetPasswordForm, 
    handleResetPassword 
} from "../logics/forgotPasswordLogic.js";

const router = express.Router();

router.get("/forgot-password", showForgotPasswordForm);
router.post("/forgot-password", handleForgotPassword);

router.get("/reset-password/:token", showResetPasswordForm);
router.post("/reset-password", handleResetPassword);

export default router;
