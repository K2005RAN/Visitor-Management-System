import dotenv from "dotenv";
dotenv.config();
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import express from "express";
import cors from "cors";
import fs from "fs";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.config.js"; 
import routes from "./routes/index.js";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import mongoose from "mongoose"; 

// --- BACKGROUND TRACKER SYSTEM IMPORT ---
import { initializeOverstayTracker } from "./utils/overstayTracker.js";

// --- 1. Stable Path Management ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure uploads folder exists relative to the server file
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log("📁 Created 'uploads' folder at:", uploadPath);
}

// --- 2. Middleware Stack ---
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// --- 3. Database Connection ---
connectDB(); 

// 🛡️ ISOLATED SAFE TRACKER HOOK INJECTION
// Fires up the automatic background monitoring alarms when database mounting settles
mongoose.connection.once("connected", () => {
    try {
        initializeOverstayTracker();
        console.log("⏰ Campus Compliance Shift-Cutoff Monitor Standby Active!");
    } catch (trackerBootError) {
        console.error("⚠️ [CRASH PREVENTED] Tracker failed to start, but backend remains ALIVE:", trackerBootError.message);
    }
});

// --- 4. Static File Hosting for Uploads ---
app.use("/uploads", express.static(uploadPath)); 

// OFFLINE CASCADING FILTER INTERCEPTOR (Resolves Dropdown Disconnect)
app.use("/api/v1/shared/employees", async (req, res, next) => {
    try {
        const { departmentId } = req.query;
        if (!departmentId) return next();

        const uri = process.env.MONGO_URI || "mongodb://localhost:27017/mycem_visitor_db";
        const dbName = uri.split("/").pop().split("?")[0] || "mycem_visitor_db";
        const baseURI = uri.substring(0, uri.lastIndexOf('/')) || "mongodb://localhost:27017";

        const client = new MongoClient(baseURI);
        await client.connect();
        
        const db = client.db(dbName);
        const usersCollection = db.collection("users");

        const cleanTextName = departmentId.replace("DEP_", "").replace(/_/g, " ");

        const matchedStaff = await usersCollection.find({
            $or: [
                { department_id: departmentId },
                { department_name: departmentId },
                { department_name: { $regex: new RegExp(`^${cleanTextName.trim()}$`, "i") } }
            ]
        }).toArray();

        await client.close();

        if (matchedStaff.length > 0) {
            return res.status(200).json({
                success: true,
                data: matchedStaff
            });
        }
        
        next();
    } catch (error) {
        next();
    }
});

// =========================================================================
// DEFINE CLEANING ENGINE FIRST (Ensures clean runtime compilation)
// =========================================================================
const cleanPassDataEngine = async (rawLogs) => {
    if (!rawLogs) return [];
    const logsArray = Array.isArray(rawLogs) ? rawLogs : [rawLogs];
    const db = mongoose.connection.db || mongoose.connection.client?.db();

    if (!db) return logsArray; 

    const processed = await Promise.all(logsArray.map(async (item) => {
        if (!item) return null;
        const pass = typeof item.toObject === "function" ? item.toObject() : { ...item };
        
        // 1. Employee Name Lookup
        let resolvedName = pass.employee_name || pass.employee_to_visit || pass.employeeTo || pass.to_visit || "Official Staff";
        const checkTarget = pass.employeeTo || pass.employee_to_visit || pass.to_visit || "";
        const targetStr = checkTarget.toString().trim();

        if (mongoose.Types.ObjectId.isValid(targetStr) && targetStr.match(/^[0-9a-fA-F]{24}$/)) {
            const userDoc = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(targetStr) });
            if (userDoc && userDoc.name) {
                resolvedName = userDoc.name;
            }
        } else if (targetStr !== "" && targetStr !== "Official Staff") {
            resolvedName = targetStr;
        }

        // 2. Department Lookup
        let resolvedDept = pass.department_name || pass.departmentTo || pass.department_to_visit || pass.dept || "General Operations";
        const checkDept = pass.departmentTo || pass.department_to_visit || pass.department_name || pass.dept || "";
        const deptStr = checkDept.toString().trim();

        if (deptStr.toUpperCase().startsWith("DEP")) {
            let cleanDept = deptStr
                .replace(/^DEP_/i, "") 
                .replace(/^DEP/i, "")  
                .replace(/_/g, " ")    
                .trim();
                
            if (cleanDept) resolvedDept = cleanDept;
        } else if (deptStr !== "" && deptStr !== "General Operations" && deptStr !== "GENERAL OPERATIONS") {
            resolvedDept = deptStr;
        }

        return {
            ...pass,
            visitor_name: pass.visitor_name || pass.name || "N/A",
            visitor_contact_no: pass.visitor_contact_no || pass.contactNo || "N/A",
            company: pass.company || pass.address || "OFFICIAL",
            employee_name: resolvedName,
            employeeTo: resolvedName,
            employee_to_visit: resolvedName,
            to_visit: resolvedName,
            department_name: resolvedDept,
            departmentTo: resolvedDept,
            department_to_visit: resolvedDept,
            dept: resolvedDept
        };
    }));

    return processed.filter(Boolean);
};

// =========================================================================
// PLUG IN DEDUPLICATED INTERCEPTOR MIDDLEWARE HOOK 
// =========================================================================
app.use("/api/v1/visitor", async (req, res, next) => {
    const currentPath = req.path.toLowerCase();
    const hasMatch = currentPath.includes("log") || 
                     currentPath.includes("history") || 
                     currentPath.includes("repot") || 
                     currentPath.includes("report") || 
                     currentPath.includes("stat") || 
                     currentPath.includes("pass") || 
                     currentPath.includes("detail");

    if (!hasMatch) return next();

    // ACCELERATED CSV EXPORT INTERCEPTOR: Traps file downloads cleanly
    if (req.query.exportFormat === "csv") {
        try {
            const { startTime, endTime } = req.query;
            let query = {};
            if (startTime && endTime) {
                query.createdAt = { $gte: new Date(startTime), $lte: new Date(endTime) };
            }

            const rawPasses = await mongoose.model("VisitorPass").find(query).sort({ createdAt: -1 }).lean();
            const cleanedList = await cleanPassDataEngine(rawPasses);

            const seenPassIds = new Set();
            const uniqueCleanedList = [];

            const prioritizedList = [...cleanedList].sort((a, b) => {
                const aValid = a.employee_name && a.employee_name !== "Official Staff" ? 1 : 0;
                const bValid = b.employee_name && b.employee_name !== "Official Staff" ? 1 : 0;
                return bValid - aValid; 
            });

            for (const row of prioritizedList) {
                if (!row) continue;
                const fingerprint = `${row.visitor_name}-${row.visitor_contact_no}`.toLowerCase().trim();
                
                if (!seenPassIds.has(fingerprint)) {
                    seenPassIds.add(fingerprint);
                    uniqueCleanedList.push(row);
                }
            }

            uniqueCleanedList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            let csvHeader = "SR.,VISITOR NAME,CONTACT,COMPANY,TO VISIT,DEPT,CHECK IN,CHECK OUT,STATUS\n";
            let csvRows = uniqueCleanedList.map((v, i) => {
                const checkIn = v.check_in_time ? new Date(v.check_in_time).toLocaleString("en-IN") : "—";
                const checkOut = (v.check_out_time || v.exit_time) ? new Date(v.check_out_time || v.exit_time).toLocaleString("en-IN") : "—";
                const statusText = Number(v.status) === 1 ? "INSIDE" : "CHECKED OUT";
                
                return `${i + 1},"${v.visitor_name}","${v.visitor_contact_no}","${v.company}","${v.employee_name}","${v.department_name}","${checkIn}","${checkOut}","${statusText}"`;
            }).join("\n");

            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename=Visitor_Report_${Date.now()}.csv`);
            
            return res.status(200).send(csvHeader + csvRows);
        } catch (err) {
            console.error("Direct Interceptor CSV Failure, falling back:", err);
        }
    }

    const originalJson = res.json;
    res.json = async function (body) {
        if (body && body.success) {
            try {
                if (body.data) {
                    if (Array.isArray(body.data)) {
                        body.data = await cleanPassDataEngine(body.data);
                    } else if (typeof body.data === "object") {
                        const singleCleaned = await cleanPassDataEngine([body.data]);
                        if (singleCleaned && singleCleaned.length > 0) body.data = singleCleaned[0];
                    }
                } 
                
                if (body.visitors && Array.isArray(body.visitors)) {
                    body.visitors = await cleanPassDataEngine(body.visitors);
                }
                if (body.history && Array.isArray(body.history)) {
                    body.history = await cleanPassDataEngine(body.history);
                }
                if (body.logs && Array.isArray(body.logs)) {
                    body.logs = await cleanPassDataEngine(body.logs);
                }

                if (body.stats) {
                    if (body.stats.recentVisitors && Array.isArray(body.stats.recentVisitors)) {
                        const cleanedRecent = await cleanPassDataEngine(body.stats.recentVisitors);
                        body.stats.recentVisitors = cleanedRecent;

                        const activeCount = cleanedRecent.filter(v => v && Number(v.status) === 1).length;
                        body.stats.total = cleanedRecent.length;
                        body.stats.active = activeCount;
                        body.stats.completed = Math.max(0, cleanedRecent.length - activeCount);
                    }
                }
            } catch (err) {
                console.error("Data Interceptor Failure:", err);
            }
        }
        return originalJson.call(this, body);
    };
    next();
});

// --- 5. API Routes ---
app.use("/api/v1/", routes);

// --- 6. Offline Production Hosting (Serving Frontend from public/) ---
const publicPath = path.join(__dirname, "public");

if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    app.get(/^\/(?!api\/).*/, (_, res) => {
        res.sendFile(path.join(publicPath, "index.html"));
    });
    console.log("🍏 Offline frontend container linked successfully via 'public' folder.");
} else {
    app.get("/", (req, res) => {
        res.send("Backend API is running. Please add your frontend build inside the public folder.");
    });
}

// --- 7. Global Error Handler ---
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(`❌ [${statusCode}] Error: ${err.message}`);
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// --- 8. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running completely offline on port: ${PORT}`);
});

// --- 9. Pure Native Mongo Admin Seed Script ---
const seedOfflineAdminNative = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://localhost:27017/mycem_visitor_db";
        const dbName = uri.split("/").pop().split("?")[0] || "mycem_visitor_db";
        const baseURI = uri.substring(0, uri.lastIndexOf('/')) || "mongodb://localhost:27017";

        const client = new MongoClient(baseURI);
        await client.connect();
        
        const db = client.db(dbName);
        const usersCollection = db.collection("users");

        await usersCollection.deleteOne({ employee_id: "MYCEM001" });

        await usersCollection.insertOne({
            name: "Offline Guard",
            employee_id: "MYCEM001",
            employee_email: "guard@mycem.com",
            contact_number: "9999999999",
            manager_email: "manager@mycem.com",
            department_id: "DEP01",
            department_name: "Security Desk",
            password: "mycempassword123", 
            role: "admin",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log("💎 Clean Offline Account Seeded! (ID: MYCEM001 / Pass: mycempassword123)");
        
        await client.close();
    } catch (error) {
        console.error("⚠️ Seeding error:", error.message);
    }
};
seedOfflineAdminNative();

// --- 10. Bulk Offline CSV Excel Migration Tool ---
const importOfflineCSVData = async () => {
    try {
        const csvFilePath = path.join(__dirname, "employees.csv"); 
        
        if (!fs.existsSync(csvFilePath)) {
            console.log("ℹ️ employees.csv not found in backend directory. Skipping sheet auto-migration.");
            return;
        }

        const uri = process.env.MONGO_URI || "mongodb://localhost:27017/mycem_visitor_db";
        const dbName = uri.split("/").pop().split("?")[0] || "mycem_visitor_db";
        const baseURI = uri.substring(0, uri.lastIndexOf('/')) || "mongodb://localhost:27017";

        const client = new MongoClient(baseURI);
        await client.connect();
        const db = client.db(dbName);
        
        const usersCollection = db.collection("users");
        const departmentsCollection = db.collection("departments");

        const csvData = fs.readFileSync(csvFilePath, "utf8");
        const lines = csvData.split(/\r?\n/);
        
        if (lines.length < 2) return;

        const headers = lines[0].split(",").map(h => h.trim());
        const userNameIdx = headers.indexOf("User Name");
        const firstNameIdx = headers.indexOf("First Name");
        const lastNameIdx = headers.indexOf("Last Name");
        const emailIdx = headers.indexOf("Email Address");
        const deptIdx = headers.indexOf("Department");

        let userRecordsInserted = 0;
        let departmentRecordsInserted = 0;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; 
            
            const currentline = lines[i].split(",");
            const employee_id = currentline[userNameIdx]?.trim();
            const rawDeptName = currentline[deptIdx]?.trim();
            
            if (!employee_id || !rawDeptName) continue;

            const firstName = currentline[firstNameIdx]?.trim() || "";
            const lastName = currentline[lastNameIdx]?.trim() || "";
            const fullName = `${firstName} ${lastName}`.trim() || `Employee ${employee_id}`;
            const employee_email = currentline[emailIdx]?.trim() || `${employee_id}@mycem.com`;

            const department_id = `DEP_${rawDeptName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;

            const userExists = await usersCollection.findOne({ employee_id });
            if (!userExists) {
                await usersCollection.insertOne({
                    name: fullName,
                    employee_id: employee_id,
                    employee_email: employee_email,
                    contact_number: "9999999999", 
                    manager_email: "manager@mycem.com", 
                    department_id: department_id,
                    department_name: rawDeptName,
                    password: "$2b$10$EPY9K0L8Xk0Z6w7Vb4Z2eOnv969HjG7Yv6k5d4e3f2g1h0i9j8k7l", 
                    role: "employee",
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                userRecordsInserted++;
            }

            const deptExists = await departmentsCollection.findOne({ department_id });
            if (!deptExists) {
                await departmentsCollection.insertOne({
                    department_id: department_id,
                    department_name: rawDeptName,
                    name: rawDeptName, 
                    createdAt: new Date()
                });
                departmentRecordsInserted++;
            }
        }

        console.log(`📊 Local Offline Migration: Instantly loaded ${userRecordsInserted} new employees & ${departmentRecordsInserted} custom departments into your database!`);
        await client.close();
    } catch (error) {
        console.error("⚠️ Bulk migration tool skipped:", error.message);
    }
};
importOfflineCSVData();