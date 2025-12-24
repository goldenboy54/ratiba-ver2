// routes/collisionReportRoutes.js
import express from "express";
import { showCollisionReport } from "../logics/collisionReportLogic.js";

const router = express.Router();

router.get("/collision-report", showCollisionReport);

export default router;
