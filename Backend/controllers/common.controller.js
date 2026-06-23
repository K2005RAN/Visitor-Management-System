import { Department } from "../models/Department.js";
// 🟢 1. Import your brand-new Employee model
import { Employee } from "../models/Employee.js"; 
import { tryCatch } from "../utils/tryCatch.js";
import { AppError } from "../utils/AppError.js";
import mongoose from "mongoose"; // 👈 🟢 ADD THIS LINE RIGHT HERE!
// Fetches a list of all departments from MongoDB.
export const getDepartments = tryCatch(async (_, res) => {
  // Select 'name' and 'deptCode' to populate the dropdown cleanly
  const departments = await Department.find({}, "name deptCode");

  if (!departments || departments.length === 0) {
    throw new AppError("No departments found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Departments fetched successfully",
    data: departments,
  });
});

// 🟢 2. Updated to fetch the 185 real employees from your Excel file
export const getEmployeesWithDepartments = tryCatch(async (req, res) => {
  const { departmentId } = req.query; // Grabs the term (e.g., "IT" or "HR") from the frontend request

  let query = { status: "active" };

  if (departmentId) {
    const cleanedSearchTerm = departmentId.trim();

    // 🟢 Scenario A: If the frontend sent a valid 24-character hexadecimal Mongoose ID
    if (mongoose.Types.ObjectId.isValid(cleanedSearchTerm)) {
      query.departmentId = cleanedSearchTerm;
    } else {
      // 🟢 Scenario B: The frontend sent a text name string (e.g., "IT").
      // We look up the department document inside the Department collection first!
      const matchedDept = await Department.findOne({
        name: { $regex: new RegExp(`^${cleanedSearchTerm}$`, "i") }
      });

      if (matchedDept) {
        // Use the valid Mongoose ObjectId reference found inside the department document
        query.departmentId = matchedDept._id;
      } else {
        // If the department text string name doesn't match any department, return an empty array cleanly
        return res.status(200).json({
          success: true,
          message: "No matching department found in records",
          data: []
        });
      }
    }
  }

  // Find the records from your 185 successfully seeded employees using the valid ID filter query
  const employees = await Employee.find(query);

  // Map fields perfectly so your frontend option drop-down lists can map them seamlessly
  const formattedData = employees.map(emp => ({
    _id: emp._id,
    name: emp.name,
    designation: emp.designation || "Staff"
  }));

  res.status(200).json({
    success: true,
    message: "Employees fetched successfully",
    data: formattedData,
  });
});