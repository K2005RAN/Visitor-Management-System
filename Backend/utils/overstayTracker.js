import cron from "node-cron";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import ExcelJS from "exceljs"; 

// 🔐 PRODUCTION TRANSPORT: Configured for Independent Custom Webmail Infrastructure
const transporter = nodemailer.createTransport({
    host: "mail.mycem.in",       
    port: 587,                   
    secure: false,               
    auth: {
        user: "mail", // 🟢 Live Office Desk Email Address
        pass: "password"           // 🟢 Your standard raw webmail login password 
    },
    tls: {
        rejectUnauthorized: false 
    },
    connectionTimeout: 15000, 
    greetingTimeout: 10000,     
    socketTimeout: 20000       
});

// 🏢 Live target inbox address for the plant's Security Manager
const securityManagerEmail = "security manager mail";

// 🏢 Executive Distribution List for End-of-Day Reports
const executiveDistributionList = [
   // list of mail ids
];

/**
 * Helper function to map database objects directly to clean HTML table rows.
 * 🟢 FIXED: Rebuilt to display exact Departments and True Check-Out times directly inside the mailbox layout.
 */
const generateVisitorTableRows = async (visitors, db) => {
    try {
        const rows = await Promise.all(visitors.map(async (visitor) => {
            // Check-In Time Local Formatting
            const checkInFormatted = visitor.check_in_time 
                ? new Date(visitor.check_in_time).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', timeZone: "Asia/Kolkata" }) 
                : "—";

            // Check-Out Time Dynamic Formatting (Reads updatedAt field when status is completed)
            const isCompleted = Number(visitor.status) === 2;
            const checkOutFormatted = (isCompleted && visitor.updatedAt)
                ? new Date(visitor.updatedAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', timeZone: "Asia/Kolkata" }) 
                : "—";

            let resolvedHostName = visitor.employee_name || "Official Staff";
            const checkTarget = visitor.employeeTo || visitor.employee_to_visit || visitor.to_visit || "";
            const targetStr = checkTarget.toString().trim();

            if (mongoose.Types.ObjectId.isValid(targetStr) && targetStr.match(/^[0-9a-fA-F]{24}$/)) {
                const userDoc = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(targetStr) });
                if (userDoc && userDoc.name) {
                    resolvedHostName = userDoc.name;
                }
            } else if (targetStr !== "" && targetStr !== "Official Staff" && !targetStr.match(/^[0-9a-fA-F]{24}$/)) {
                resolvedHostName = targetStr;
            }

            // Extract real custom department key identifiers directly
            const departmentContext = visitor.departmentTo || visitor.department_to_visit || visitor.department_name || "N/A";
            
            return `
                <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                    <td style="padding: 10px; font-weight: bold; color: #b91c1c; font-family: monospace;">
                        ${visitor.passId || visitor.pass_id || "—"}
                    </td>
                    <td style="padding: 10px; color: #334155; font-weight: 500;">
                        ${visitor.visitor_name || "—"}
                    </td>
                    <td style="padding: 10px; color: #0f172a; font-weight: 600;">
                        ${departmentContext.toUpperCase()}
                    </td>
                    <td style="padding: 10px; color: #334155;">
                        ${resolvedHostName}
                    </td>
                    <td style="padding: 10px; font-family: monospace; color: #16a34a; font-weight: 500;">
                        ${checkInFormatted}
                    </td>
                    <td style="padding: 10px; font-family: monospace; color: #dc2626; font-weight: 500;">
                        ${checkOutFormatted}
                    </td>
                </tr>
            `;
        }));
        
        return rows.join("");
    } catch (err) {
        console.error("❌ [ISOLATION CAPTURE] Error mapping table strings:", err.message);
        return "";
    }
};

export const initializeOverstayTracker = () => {
    try {
        console.log("⏰ [CRON SPAWN] Registering background campus clearance monitor...");

        // -------------------------------------------------------------------------
        // 🌆 EXCLUSIVE PRODUCTION STREAM: DAILY 7:00 PM SHIFT CUTOFF REPORT (IST)
        // -------------------------------------------------------------------------
        cron.schedule("0 19 * * *", async () => {
            console.log("🚨 [CRITICAL AUDIT] Cutoff hour reached (9:00 PM). Compiling campus clearance log...");
            try {
                const db = mongoose.connection.db || mongoose.connection.client?.db();
                if (!db) return;

                const remainingVisitors = await db.collection("visitorpasses").find({ status: 1 }).toArray();

                if (remainingVisitors.length === 0) {
                    await transporter.sendMail({
                        from: `"HeidelbergCement Security Desk" <security.desk@mycem.in>`,
                        to: securityManagerEmail,
                        subject: `🟢 HeidelbergCement Campus Visitor Clearance Status: 100% Clear`,
                        html: `
                            <div style="font-family: Arial, sans-serif; background-color: #ffffff; border: 1px solid #e2e8f0; max-width: 550px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                                <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                                    <h2 style="color: #ffffff; margin: 0; font-size: 18px;">CAMPUS VISITOR CLEARANCE STATUS</h2>
                                </div>
                                <div style="padding: 30px; text-align: center;">
                                    <h3 style="color: #111827;">100% Clear Operational Log</h3>
                                    <p style="color: #4b5563; font-size: 14px;">All registered external business personnel and visitors have cleared the plant boundary lines.</p>
                                </div>
                            </div>
                        `
                    });
                    return;
                }

                const tableRows = await generateVisitorTableRows(remainingVisitors, db);
                await transporter.sendMail({
                    from: `"HeidelbergCement Security Desk" <mail>`,
                    to: securityManagerEmail,
                    subject: `⚠️ HeidelbergCement Campus Visitor Clearance Status: ${remainingVisitors.length} Active Pass(es)`,
                    html: `<div>...</div>`
                });
            } catch (streamError) {
                console.error("❌ [ISOLATION CAPTURE] Cutoff Monitor failed:", streamError.message);
            }
        });

        // -------------------------------------------------------------------------
        // 📊 AUTOMATION STREAM: EXCEL & INLINE MAIL DISPATCH RUNS AT 10:00 PM
        // -------------------------------------------------------------------------
        cron.schedule("0 22 * * *", async () => {
            console.log("📊 [MASTER AUDIT] 4:25 PM Reached. Compiling matching daily visitor dataset...");
            try {
                const db = mongoose.connection.db || mongoose.connection.client?.db();
                if (!db) return;

                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);

                // Fetch data points matching today's system creation timestamps
                const rawVisitors = await db.collection("visitorpasses").find({
                    check_in_time: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                }).toArray();

                if (rawVisitors.length === 0) {
                    console.log("📉 No visitor entries found matching today's ISO timestamps.");
                    return;
                }

                // 🛡️ HUMAN DEDUPLICATION ENGINE: Groups rows strictly by visitor contact parameters
                const uniqueVisitorsMap = new Map();
                for (const item of rawVisitors) {
                    const contactKey = item.visitor_contact_no || item.contactNo || item._id.toString();
                    
                    // Prioritize keeping the completed processing token (status === 2)
                    if (!uniqueVisitorsMap.has(contactKey) || Number(item.status) === 2) {
                        uniqueVisitorsMap.set(contactKey, item);
                    }
                }
                
                const dailyVisitors = Array.from(uniqueVisitorsMap.values());

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet("Daily Visitor Summary");

                worksheet.columns = [
                    { header: "Sr.", key: "sr", width: 6 },
                    { header: "Pass ID", key: "passId", width: 18 },
                    { header: "Visitor Name", key: "visitor_name", width: 25 },
                    { header: "Contact Number", key: "visitor_contact_no", width: 16 },
                    { header: "Company ", key: "company", width: 22 },
                    { header: "Department", key: "department_name", width: 20 }, 
                    { header: "Employee Name", key: "employee_name", width: 22 },
                    { header: "In Time", key: "check_in", width: 22 },
                    { header: "Out Time", key: "check_out", width: 22 },
                    { header: "Current Status", key: "status_text", width: 15 }
                ];

                for (let i = 0; i < dailyVisitors.length; i++) {
                    const v = dailyVisitors[i];
                    
                    let resolvedHostName = v.employee_name || "Official Staff";
                    const checkTarget = v.employeeTo || v.employee_to_visit || v.to_visit || "";
                    const targetStr = checkTarget.toString().trim();

                    if (mongoose.Types.ObjectId.isValid(targetStr) && targetStr.match(/^[0-9a-fA-F]{24}$/)) {
                        const userDoc = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(targetStr) });
                        if (userDoc && userDoc.name) resolvedHostName = userDoc.name;
                    }

                    const departmentContext = v.departmentTo || v.department_to_visit || v.department_name || "N/A";
                    
                    const isCompleted = Number(v.status) === 2;
                    const displayCheckout = (isCompleted && v.updatedAt)
                        ? new Date(v.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) 
                        : "—";

                    worksheet.addRow({
                        sr: i + 1,
                        passId: v.passId || v.pass_id || "—",
                        visitor_name: v.visitor_name || v.name || "N/A",
                        visitor_contact_no: v.visitor_contact_no || v.contactNo || "N/A",
                        company: v.company || "OFFICIAL",
                        department_name: departmentContext.toUpperCase(), 
                        employee_name: resolvedHostName,
                        check_in: v.check_in_time ? new Date(v.check_in_time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—",
                        check_out: displayCheckout, 
                        status_text: isCompleted ? "COMPLETED" : "INSIDE"
                    });
                }

                worksheet.getRow(1).eachCell((cell) => {
                    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } }; 
                    cell.alignment = { horizontal: "center" };
                });

                const excelBuffer = await workbook.xlsx.writeBuffer();
                const datestamp = new Date().toISOString().split("T")[0];
                
                // 🟢 LINKED INLINE ROW GENERATOR: Now processes the deduplicated mapping structure seamlessly
                const inlineTableRows = await generateVisitorTableRows(dailyVisitors, db);

                await transporter.sendMail({
                    from: `"HeidelbergCement Security Desk" <security.desk@mycem.in>`,
                    to: securityManagerEmail,
                    bcc: executiveDistributionList.join(", "), 
                    subject: `📊 HeidelbergCement Daily Operations Summary: ${dailyVisitors.length} Total Entries`,
                    html: `
                        <div style="font-family: Arial, sans-serif; background-color: #ffffff; border: 1px solid #e2e8f0; max-width: 800px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                            <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                                <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600; letter-spacing: 0.5px;">DAILY FACILITY VISITOR LOG SUMMARY</h2>
                            </div>
                            <div style="padding: 25px;">
                                <p><strong>Dear Management Team,</strong></p>
                                <p>Please find attached the official system-generated Excel workbook tracking all operational visitor movements for today. A summary overview is listed below:</p>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; text-align: left;">
                                    <thead>
                                        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #0f172a;">
                                            <th style="padding: 10px;">Pass ID</th>
                                            <th style="padding: 10px;">Visitor Name</th>
                                            <th style="padding: 10px;">Department</th>
                                            <th style="padding: 10px;">Employee</th>
                                            <th style="padding: 10px;">In Time</th>
                                            <th style="padding: 10px;">Out Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>${inlineTableRows}</tbody>
                                </table>
                            </div>
                        </div>
                    `,
                    attachments: [
                        {
                            filename: `HeidelbergCement_Visitor_Report_${datestamp}.xlsx`,
                            content: excelBuffer,
                            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        }
                    ]
                });

                console.log(`📨 Deduplicated email content and spreadsheet processed and dispatched.`);
            } catch (err) {
                console.error("❌ [ISOLATION CAPTURE] 4:25 PM Master Report Error:", err.message);
            }
        });

    } catch (initializationError) {
        console.error("❌ [CRITICAL CAPTURE] Failed to initialize cron loops entirely:", initializationError.message);
    }
};
