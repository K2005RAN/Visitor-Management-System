import express from "express";
import { login, logout, register } from "../controllers/auth.controller.js";

const router = express.Router();

// Temporary: Use this to create your MYCEM001 account
router.post("/register", register); 

router.post("/login", login);
router.post("/logout", logout);

export default router;