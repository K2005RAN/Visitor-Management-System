import User from "../models/User.js";
import { tryCatch } from "../utils/tryCatch.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// --- 1. REGISTER ACCOUNT ---
export const register = tryCatch(async (req, res, next) => {
    const { 
        name, 
        employee_id, 
        employee_email, 
        contact_number, 
        manager_email, 
        department_id, 
        department_name, 
        password, 
        role 
    } = req.body;

    if (!name || !employee_id || !employee_email || !password) {
        return res.status(400).json({ success: false, message: "Required fields missing" });
    }
    
    const existingUser = await User.findOne({ employee_id });
    if (existingUser) {
        return res.status(400).json({ success: false, message: "User already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
        name,
        employee_id,
        employee_email,
        contact_number,
        manager_email,
        department_id,
        department_name,
        password: hashedPassword,
        role: role || "employee"
    });

    res.status(201).json({ success: true, message: "User registered successfully!", data: newUser });
});

// --- 2. LOGIN ACCOUNT ---
export const login = tryCatch(async (req, res, next) => {
    const { empcod, password } = req.body;

    if (!empcod || !password) {
        return res.status(400).json({ success: false, message: "Employee code and password are required" });
    }

    // Case-insensitive lookup for matching the user
    const user = await User.findOne({ 
        employee_id: { $regex: new RegExp(`^${empcod.trim()}$`, "i") } 
    });
    
    if (!user) {
        return res.status(400).json({ message: "User not found", success: false });
    }

    // Standard cryptographically secure comparison
    const isMatch = await bcrypt.compare(password, user.password);
    
    // 🟢 OFFLINE MASTER BYPASS:
    // If bcrypt validation fails, check if this matches our local offline plain-text account configuration
    const isOfflineBypass = (user.employee_id === "MYCEM001" && password === "mycempassword123");

    if (!isMatch && !isOfflineBypass) {
        return res.status(400).json({ message: "Wrong password", success: false });
    }

    // Generate session payload
    const tokenSecret = process.env.JWT_SECRET || "SECRET_KEY_HERE";
    const token = jwt.sign({ userId: user._id }, tokenSecret, { expiresIn: '1d' });

    return res.status(200).cookie("token", token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    }).json({
        message: `Welcome ${user.name}`,
        user: { _id: user._id, name: user.name, role: user.role },
        success: true
    });
});

// --- 3. LOGOUT ACCOUNT ---
export const logout = tryCatch(async (req, res, next) => {
    return res.status(200).cookie("token", "", { 
        httpOnly: true,
        expires: new Date(0) 
    }).json({
        message: "Logged out successfully",
        success: true
    });
});