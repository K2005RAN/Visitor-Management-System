import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Department } from "./models/Department.js"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

const officialDepartments = [
  { name: "Accounts", deptCode: "DEPT-ACC" },
  { name: "Civil", deptCode: "DEPT-CIV" },
  { name: "CSR", deptCode: "DEPT-CSR" },
  { name: "Electrical", deptCode: "DEPT-ELE" },
  { name: "Environment", deptCode: "DEPT-ENV" },
  { name: "Hospital", deptCode: "DEPT-HOS" },
  { name: "HR", deptCode: "DEPT-HR" },
  { name: "HR CSR", deptCode: "DEPT-HRCSR" },
  { name: "HR Land", deptCode: "DEPT-HRLND" },
  { name: "HR Mess" , deptCode: "DEPT-HRMSS"},
  { name: "HR Time Office", deptCode: "DEPT-HRTOF" },
  { name: "HR welfare", deptCode: "DEPT-HRWLF" },
  { name: "Human Resources", deptCode: "DEPT-HUMRES" },
  { name: "Industrial Engineering", deptCode: "DEPT-INDE" },
  { name: "Instrumentation", deptCode: "DEPT-INS" },
  { name: "IT", deptCode: "DEPT-IT" },
  { name: "Maintennance", deptCode: "DEPT-MNT" },
  { name: "MCC", deptCode: "DEPT-MCC" },
  { name: "MCC-Electrical", deptCode: "DEPT-MCCE" },
  { name: "MCC-Mines", deptCode: "DEPT-MCCM" },
  { name: "Mechanical", deptCode: "DEPT-MCH" },
  { name: "Mines", deptCode: "DEPT-MNS" },
  { name: "Ngh Project", deptCode: "DEPT-NGH" },
  { name: "Procurement", deptCode: "DEPT-PRC" },
  { name: "Production", deptCode: "DEPT-PRD" },
  { name: "QC", deptCode: "DEPT-QC" },
  { name: "Quality Control", deptCode: "DEPT-QLC" },
  { name: "Safety", deptCode: "DEPT-SFT" },
  { name: "Sales & Marketing", deptCode: "DEPT-SLM" },
  { name: "Security", deptCode: "DEPT-SEC" },
  { name: "Stores", deptCode: "DEPT-STR" },
  { name: "Stores-Raw Material", deptCode: "DEPT-STRM" },
  { name: "Technical", deptCode: "DEPT-TCH" },
  { name: "WHRS", deptCode: "DEPT-WHR" }
];

const seedDB = async () => {
  try {
    const dbUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!dbUri) {
      throw new Error("Missing database connection string! Check your .env file.");
    }

    console.log("🔄 Attempting to connect to MongoDB...");
    await mongoose.connect(dbUri);
    console.log("⚡ Connected to Database successfully!");

    // 🟢 Drop the unique index to clear the configuration block constraints
    try {
      console.log("⏳ Clearing index restrictions...");
      await Department.collection.dropIndex("deptCode_1");
      console.log("🗑️ Broken unique index dropped successfully.");
    } catch (idxErr) {
      console.log("ℹ️ Index didn't exist or was already clear, moving to data reset.");
    }

    // Wipe out any older formatting documents completely
    await Department.deleteMany({});
    console.log("🗑️ Cleared older department records.");

    // Direct insert clean data values array mapping
    await Department.insertMany(officialDepartments);
    console.log("✅ Successfully seeded all 34 custom MYCEM Plant Departments with explicit codes!");

    process.exit(0);
  } catch (error) {
    console.error("❌ CRITICAL SEEDING ERROR:", error.message);
    process.exit(1);
  }
};

seedDB();