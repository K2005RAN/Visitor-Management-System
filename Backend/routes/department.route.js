import express from "express";
import { Department } from "../models/Department.js";

const router = express.Router();

// GET endpoint to fetch all departments alphabetically
router.get("/list", async (req, res) => {
  try {
    const departments = await Department.find({}).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch plant departments list",
      error: error.message
    });
  }
});

export default router;