import { Router } from "express";
import { createCompanyInformation } from "../controllers/configController.js";

const router = Router();

router.post("/enterprise", createCompanyInformation);

export default router;
