import {Department}from "../models/Department.js";
import User from "../models/User.js";
import { tryCatch } from "../utils/tryCatch.js";
import { AppError } from "../utils/AppError.js";

// --- DEPARTMENTS ---

export const fetchDepartments = tryCatch(async (_, res) => {
    const data = await Department.find({});
    res.status(200).json({
        success: true,
        message: "Departments fetched successfully",
        data: data,
    });
});

export const addDepartment = tryCatch(async (req, res) => {
    const { departmentName, deptCode } = req.body;
    if (!departmentName || !deptCode) {
        throw new AppError("Department name and code are required", 400);
    }
    const newDept = await Department.create({ deptName: departmentName, deptCode });
    res.status(201).json({ success: true, message: "Department added successfully", data: newDept });
});

export const updateDepartment = tryCatch(async (req, res) => {
    const { deptCode } = req.params;
    const update = await Department.findOneAndUpdate({ deptCode }, req.body, { new: true });
    if (!update) throw new AppError("Department not found", 404);
    res.status(200).json({ success: true, message: "Department updated successfully" });
});

export const deleteDepartment = tryCatch(async (req, res) => {
    const { deptCode } = req.params;
    const result = await Department.findOneAndDelete({ deptCode });
    if (!result) throw new AppError("Department not found", 404);
    res.status(200).json({ success: true, message: "Department deleted successfully" });
});

// --- USERS ---

export const fetchUsers = tryCatch(async (_, res) => {
    const data = await User.find({});
    res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: data,
    });
});

export const addUser = tryCatch(async (req, res) => {
    const newUser = await User.create(req.body);
    res.status(201).json({ success: true, message: "User added successfully", data: newUser });
});

export const updateUser = tryCatch(async (req, res) => {
    const { id } = req.params;
    const update = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (!update) throw new AppError("User not found", 404);
    res.status(200).json({ success: true, message: "User updated successfully" });
});

export const deleteUser = tryCatch(async (req, res) => {
    const { id } = req.params;
    const result = await User.findByIdAndDelete(id);
    if (!result) throw new AppError("User not found", 404);
    res.status(200).json({ success: true, message: "User deleted successfully" });
});