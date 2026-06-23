import mongoose from "mongoose";
import exceljs from "exceljs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Department } from "./models/Department.js"; 
import { Employee } from "./models/Employee.js"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

const seedEmployeesFromExcel = async () => {
  try {
    const dbUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!dbUri) throw new Error("Missing database connection string in .env");

    console.log("🔄 Connecting to Database...");
    await mongoose.connect(dbUri);
    console.log("⚡ Connected successfully!");

    // Clear older temporary staff listings to avoid data duplication
    await Employee.deleteMany({});
    console.log("🗑️ Cleared previous employee database records.");

    const workbook = new exceljs.Workbook();
    const excelFilePath = path.join(__dirname, "employees.xlsx");
    
    console.log(`📂 Loading Excel data stream from: ${excelFilePath}...`);
    await workbook.xlsx.readFile(excelFilePath);
    
    const worksheet = workbook.getWorksheet(1); 
    const employeesToInsert = [];
    
    console.log("⏳ Processing spreadsheet row items...");

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers on row 1

      // 🟢 CORRECTED COLUMN INDEXES BASED ON YOUR TEMPLATE SIDE-BY-SIDE
      const firstName = row.getCell(4).text?.trim() || "";
      const lastName = row.getCell(5).text?.trim() || "";
      const fullName = `${firstName} ${lastName}`.trim();
      
      const email = row.getCell(9).text?.trim() || "";          // 👈 Column 9 is Email Address
      const titleDesignation = row.getCell(10).text?.trim() || "Staff"; // 👈 Column 10 is Title
      const deptName = row.getCell(11).text?.trim();            // 👈 Column 11 is Department

      if (fullName && deptName) {
        employeesToInsert.push({ 
          name: fullName, 
          deptName, 
          email, 
          designation: titleDesignation 
        });
      }
    });

    const finalRecords = [];
    console.log("⏳ Matching structural plant department references...");
    
    for (const record of employeesToInsert) {
      // Find matching department case-insensitively
      const matchedDept = await Department.findOne({ 
        name: { $regex: new RegExp(`^${record.deptName}$`, "i") } 
      });

      if (matchedDept) {
        finalRecords.push({
          name: record.name,
          email: record.email,
          designation: record.designation,
          departmentId: matchedDept._id,
          status: "active"
        });
      } else {
        console.warn(`⚠️ Skipping "${record.name}": Department string "${record.deptName}" not found in DB.`);
      }
    }

    if (finalRecords.length > 0) {
      await Employee.insertMany(finalRecords);
      console.log(`\n✅ SUCCESS! Seeded ${finalRecords.length} employees matching your Excel template columns directly.`);
    } else {
      console.log("❌ No valid matching records found to import.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ CRITICAL INGESTION ERROR:", error.message);
    process.exit(1);
  }
};

seedEmployeesFromExcel();