import express from "express";
// Import the controller function we updated earlier
import { getEmployeesWithDepartments } from "../controllers/common.controller.js"; 

const router = express.Router();

// 🟢 FIXED: This maps exactly to "/shared/employees" when combined with routes/index.js
router.get("/employees", getEmployeesWithDepartments);

export default router;