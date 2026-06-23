import VisitorPass from "../models/VisitorPass.js"; 
import { tryCatch } from "../utils/tryCatch.js";
import mongoose from "mongoose";

// --- UNIVERSAL TEXT FORMATTER ENGINE ---
// Explicitly replaces Hex IDs and DEP_ codes with clean text variables
const cleanPassRecord = async (doc) => {
    if (!doc) return null;
    const pass = typeof doc.toObject === "function" ? doc.toObject() : doc;
    const db = mongoose.connection.db;

    // 1. Resolve Person to Meet Name
    if (pass.employee_name && !pass.employee_name.match(/^[0-9a-fA-F]{24}$/) && pass.employee_name !== "Official Staff") {
        pass.employeeTo = pass.employee_name;
        pass.employee_to_visit = pass.employee_name;
    } else {
        const checkTarget = pass.employeeTo || pass.employee_to_visit;
        if (checkTarget) {
            if (mongoose.Types.ObjectId.isValid(checkTarget.toString().trim())) {
                const user = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(checkTarget.toString().trim()) });
                if (user) {
                    pass.employeeTo = user.name;
                    pass.employee_to_visit = user.name;
                    pass.employee_name = user.name;
                }
            } else {
                const user = await db.collection("users").findOne({ employee_id: checkTarget.toString().trim() });
                if (user) {
                    pass.employeeTo = user.name;
                    pass.employee_to_visit = user.name;
                    pass.employee_name = user.name;
                }
            }
        }
    }
    if (!pass.employee_name || pass.employee_name.match(/^[0-9a-fA-F]{24}$/)) {
        pass.employee_name = pass.employee_to_visit || "Official Staff";
    }

    // 2. Resolve Department Name
    if (pass.department_name && !pass.department_name.startsWith("DEP_") && pass.department_name !== "General Operations") {
        pass.departmentTo = pass.department_name;
        pass.department_to_visit = pass.department_name;
    } else {
        const checkDept = pass.departmentTo || pass.department_to_visit || "";
        if (checkDept.startsWith("DEP_")) {
            const cleanDept = checkDept.replace("DEP_", "").replace(/_/g, " ");
            pass.departmentTo = cleanDept;
            pass.department_to_visit = cleanDept;
            pass.department_name = cleanDept;
        } else if (checkDept) {
            pass.department_name = checkDept;
        }
    }
    if (!pass.department_name) pass.department_name = "General Operations";

    return pass;
};

// --- 1. GENERATE PASS (Automatic Check-In) ---
export const generatePass = tryCatch(async (req, res) => {
    const { 
        name, visitor_name, contactNo, visitor_contact_no,
        company, address, purposeOfVisit, purpose_of_visit,
        departmentTo, employeeTo, employee_name, department_name 
    } = req.body;

    const final_name = name || visitor_name;
    const final_contact = contactNo || visitor_contact_no;
    const final_company = (company || address || "").trim() !== "" ? (company || address).trim() : "OFFICIAL";

    if (!final_name || !final_contact) {
        return res.status(400).json({ success: false, message: "Visitor details missing." });
    }

    const uniquePassId = `MYCEM-${Math.floor(100000 + Math.random() * 900000)}`;
    const db = mongoose.connection.db;
    
    let savedEmployeeName = employee_name || "Official Staff";
    let savedDepartmentName = department_name || "General Operations";

    if (employeeTo) {
        let userDoc = null;
        if (mongoose.Types.ObjectId.isValid(employeeTo.toString().trim())) {
            userDoc = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(employeeTo.toString().trim()) });
        } else {
            userDoc = await db.collection("users").findOne({ employee_id: employeeTo.toString().trim() });
        }
        if (userDoc) savedEmployeeName = userDoc.name;
    }

    if (departmentTo) {
        savedDepartmentName = departmentTo.startsWith("DEP_") 
            ? departmentTo.replace("DEP_", "").replace(/_/g, " ") 
            : departmentTo;
    }

    const newPass = await VisitorPass.create({
        ...req.body,
        passId: req.body.passId || uniquePassId, 
        name: final_name, visitor_name: final_name,
        contactNo: final_contact, visitor_contact_no: final_contact,
        company: final_company, address: final_company,
        employeeTo, employee_to_visit: savedEmployeeName, employee_name: savedEmployeeName,
        departmentTo, department_name: savedDepartmentName,
        status: 1, check_in_time: new Date() 
    });

    res.status(201).json({ success: true, data: await cleanPassRecord(newPass) });
});

// --- 2. FETCH VISITORS / MASTER HISTORY ---
export const getAllVisitors = tryCatch(async (req, res) => {
    const rawPasses = await VisitorPass.find({}).sort({ createdAt: -1 });
    const processed = await Promise.all(rawPasses.map(pass => cleanPassRecord(pass)));

    const formattedHistory = processed.map(v => ({
        _id: v._id,
        passId: v.passId,
        visitor_name: v.visitor_name || v.name || "N/A",
        visitor_photo: v.visitor_photo || v.visitorPhoto || "",
        visitor_contact_no: v.visitor_contact_no || v.contactNo || "N/A",
        company: v.company || "OFFICIAL",
        last_visit: v.createdAt,
        check_in_time: v.check_in_time,
        check_out_time: v.check_out_time,
        status: v.status,
        employee_name: v.employee_name,
        to_visit: v.employee_name,
        department_name: v.department_name,
        total_passes: 1
    }));

    res.status(200).json({ success: true, data: formattedHistory });
});

// --- 3. FETCH GROUPED DAILY LOGS (In/Out pipeline) ---
export const getDailyGroupedLogs = tryCatch(async (req, res) => {
    const now = new Date();
    const startObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    startObj.setMinutes(startObj.getMinutes() - 330); 
    const endObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    endObj.setMinutes(endObj.getMinutes() - 330); 

    const logs = await VisitorPass.find({ createdAt: { $gte: startObj, $lte: endObj } }).sort({ createdAt: -1 });
    const processedLogs = await Promise.all(logs.map(log => cleanPassRecord(log)));

    res.status(200).json({ success: true, data: processedLogs });
});

// --- 4. REPORTS ENDPOINT LOGIC SECTOR ---
export const getVisitorReport = tryCatch(async (req, res) => {
    const { startTime, endTime, exportFormat } = req.query;
    let query = {};
    
    if (startTime && endTime) {
        query.createdAt = { $gte: new Date(startTime), $lte: new Date(endTime) };
    }

    const logs = await VisitorPass.find(query).sort({ createdAt: -1 });
    const processedReports = await Promise.all(logs.map(log => cleanPassRecord(log)));

    // 🟢 DYNAMIC EXPORT SWITCHBAR FOR THE DIRECT CSV SPREADSHEET ENGINE
    if (exportFormat === "csv") {
        let csvHeader = "SR.,VISITOR NAME,CONTACT,COMPANY,TO VISIT,DEPT,CHECK IN,CHECK OUT,STATUS\n";
        
        let csvRows = processedReports.map((v, i) => {
            const checkIn = v.check_in_time ? new Date(v.check_in_time).toLocaleString("en-IN") : "—";
            const checkOut = (v.check_out_time || v.exit_time) ? new Date(v.check_out_time || v.exit_time).toLocaleString("en-IN") : "—";
            const statusText = Number(v.status) === 1 ? "INSIDE" : "CHECKED OUT";
            
            return `${i + 1},"${v.visitor_name || v.name}","${v.visitor_contact_no || v.contactNo}","${v.company}","${v.employee_name}","${v.department_name}","${checkIn}","${checkOut}","${statusText}"`;
        }).join("\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=Visitor_Report_${Date.now()}.csv`);
        return res.status(200).send(csvHeader + csvRows);
    }

    const reportFormat = processedReports.map(v => ({
        visitor_name: v.visitor_name || v.name,
        visitor_contact_no: v.visitor_contact_no || v.contactNo,
        company: v.company,
        employee_name: v.employee_name,
        to_visit: v.employee_name,
        department_name: v.department_name,
        check_in_time: v.check_in_time,
        check_out_time: v.check_out_time,
        status: Number(v.status) === 1 ? "INSIDE" : "CHECKED OUT"
    }));

    res.status(200).json({ success: true, data: reportFormat });
});

// --- 5. FETCH SINGLE SECURE PASS DETAILS ---
export const getVisitorPassDetails = tryCatch(async (req, res) => {
    const { passId } = req.params;
    let pass = await VisitorPass.findOne({ passId }) || (passId.match(/^[0-9a-fA-F]{24}$/) && await VisitorPass.findById(passId));

    if (!pass) return res.status(404).json({ success: false, message: "Pass missing" });
    res.status(200).json({ success: true, data: await cleanPassRecord(pass) });
});