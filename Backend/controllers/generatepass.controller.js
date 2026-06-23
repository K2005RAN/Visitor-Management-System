import nodemailer from "nodemailer";
import VisitorPass from "../models/VisitorPass.js"; 
import { tryCatch } from "../utils/tryCatch.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/User.js"; 

// Initialize the free Nodemailer transport mechanism directly for the test project
const transporter = nodemailer.createTransport({
    host: "mail.mycem.in",       // 👈 Ask your plant IT for this SMTP host address
    port: 587,                   // 👈 Standard secure port for corporate webmail
    secure: false,               // 👈 Must be false for port 587 (uses STARTTLS)
    auth: {
        user: "security.desk@mycem.in", 
        pass: "Welcome2026@" // 👈 Paste your webmail password or app password here
    },
    tls: {
        rejectUnauthorized: false // 🛡️ Prevents corporate firewalls from blocking the connection
    }
});

// Auto-verify connection integrity on server initialization
transporter.verify((error, success) => {
    if (error) {
        console.log("❌ Email Transport Initialization Failed:", error);
    } else {
        console.log("🚀 Email Transporter linked successfully!");
    }
});

const generateMycemPassId = () => {
    const prefix = "MYCEM"; 
    const uniqueDigits = Math.floor(1000000 + Math.random() * 9000000); 
    return `${prefix}${uniqueDigits}`; 
};

/* Generate Visitor Pass (🟢 DUAL DISTINCT EMAILS IMPLEMENTED) */
export const generateVisitorPass = tryCatch(async (req, res) => {
    const data = req.body;

    if (!data.name || !data.contactNo) {
        throw new AppError("Name and Contact No are required", 400);
    }

    const rawCompany = data.company || data.address || "";
    const finalCompany = rawCompany.trim() !== "" ? rawCompany.trim() : "OFFICIAL";

    // 1. Check if visitor profile context already exists
    let visitor = await VisitorPass.findOne({ visitor_contact_no: data.contactNo, status: 0 });

    if (!visitor) {
        const profileToken = `PROFILE-${data.contactNo}`;

        visitor = await VisitorPass.create({
            passId: profileToken,    
            pass_id: profileToken,   
            visitor_name: data.name,
            visitor_contact_no: data.contactNo,
            visitor_email: data.email || "",
            company: finalCompany,
            address: finalCompany,
            visitor_photo: data.visitorPhoto,
            status: 0 
        });
    } else {
        if (!visitor.company || visitor.company === "N/A" || visitor.company.trim() === "") {
            visitor.company = finalCompany;
            visitor.address = finalCompany;
            await visitor.save();
        }
    }

    // 2. Generate the unique transaction passId for the physical gate slip entry
    const generatedPassId = generateMycemPassId();

    // 3. Create the Active Pass Record
    const newPass = await VisitorPass.create({
        passId: generatedPassId,    
        pass_id: generatedPassId,   
        visitorId: visitor._id,
        visitor_name: data.name,
        visitor_contact_no: data.contactNo,
        visitor_email: data.email || "",
        visitor_photo: data.visitorPhoto,
        
        company: finalCompany,
        address: finalCompany,
        departmentTo: data.departmentTo,
        department_to_visit: data.departmentTo || "N/A",
        employeeTo: data.employeeTo,
        employee_to_visit: data.employeeTo || "N/A",
        purposeOfVisit: data.purposeOfVisit || "OFFICIAL",
        purpose_of_visit: data.purposeOfVisit || "OFFICIAL",
        
        // Safety Compliance Payload Mappings
        safety_induction: data.safetyInduction || "no", 
        ppe_info: data.ppeInfo || [],                  
        
        allowOn: data.allowOn ? new Date(data.allowOn) : new Date(),
        allow_on: data.allowOn ? new Date(data.allowOn) : new Date(),
        allowTill: data.allowTill ? new Date(data.allowTill) : null,
        allow_till: data.allowTill ? new Date(data.allowTill) : null,
        no_of_people: data.noOfPeople || 1,
        status: 1, 
        check_in_time: new Date() 
    });

    // ✉️ 4. AUTOMATED EMAIL DISPATCH TRIGGER
    try {
        let recipientEmail = data.hostEmail; 
        let hostNameText = data.employee_name || "Official Staff";

        // FALLBACK DISPATCH: If hostEmail is empty from the client side, use the ID to query MongoDB directly
        if (!recipientEmail || recipientEmail.trim() === "" || recipientEmail.toLowerCase() === "na") {
            if (data.employeeTo && data.employeeTo.toString().match(/^[0-9a-fA-F]{24}$/)) {
                const verifiedDbUser = await User.findById(data.employeeTo);
                if (verifiedDbUser) {
                    recipientEmail = verifiedDbUser.email || verifiedDbUser.emailId || verifiedDbUser.mail || "";
                    hostNameText = verifiedDbUser.name || hostNameText;
                }
            }
        }

        // Hardcode fallback email for active terminal testing cycles if it's missing or says "na"
        if (!recipientEmail || recipientEmail.trim() === "" || recipientEmail.toLowerCase() === "na") {
            recipientEmail = "security.desk@mycem.in";
        }

 // -----------------------------------------------------------------
        // ⏰ TIME STAMP ISOLATION: Format the operational In-Time cleanly
        // -----------------------------------------------------------------
        const checkInDate = newPass && newPass.createdAt ? new Date(newPass.createdAt) : new Date();
        const formattedInTime = checkInDate.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        // -----------------------------------------------------------------
        // 📧 FORMAT 1: Modern Operational Alert for the Host Employee
        // -----------------------------------------------------------------
        if (recipientEmail && recipientEmail.trim() !== "") {
            const mailOptions = {
                from: `"HeidelbergCement Security Desk" <security.desk@mycem.in>`,
                to: recipientEmail.trim(), 
                subject: `🔔 Visitor Arrived: ${data.name}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;">
                        
                        <div style="margin-bottom: 20px;">
                            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f766e; background-color: #ccfbf1; padding: 4px 8px; border-radius: 6px;">Main Gate Pass</span>
                        </div>

                        <h2 style="font-size: 20px; font-weight: 700; color: #0f766e; margin: 0 0 8px 0; letter-spacing: -0.025em;">Visitor Check-In Alert</h2>
                        <p style="font-size: 15px; line-height: 1.5; color: #475569; margin: 0 0 20px 0;">Hello <strong>${hostNameText}</strong>, a visitor has completed entry checks at the security desk and is moving toward your section.</p>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6;">
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b; font-weight: 500; width: 35%;">Visitor Name</td>
                                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${data.name}</td>
                                        </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Company</td>
                                    <td style="padding: 6px 0; color: #0f172a;">${finalCompany}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Purpose</td>
                                    <td style="padding: 6px 0; color: #0f172a;">${data.purposeOfVisit || "Official"}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Total Visitors</td>
                                    <td style="padding: 6px 0; color: #0f172a;">${data.noOfPeople || 1} Person(s)</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Arrival Time</td>
                                    <td style="padding: 6px 0; color: #0f766e; font-weight: 600;">${formattedInTime}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0 0 0; color: #64748b; font-weight: 500; border-top: 1px dashed #e2e8f0;">Pass ID</td>
                                    <td style="padding: 12px 0 0 0; color: #b91c1c; font-weight: 700; font-family: monospace; font-size: 15px; border-top: 1px dashed #e2e8f0;">${generatedPassId}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">This is an automated operational system message. Please do not reply directly.</p>
                    </div>
                `
            };

            transporter.sendMail(mailOptions).catch(err => {
                console.error("⚠️ Background host email dispatch failed to send:", err);
            });
        }

        // -----------------------------------------------------------------
        // 🛡️ FORMAT 2: Clean, Corporate Compliance Log for Security Manager
        // -----------------------------------------------------------------
        const securityManagerEmail = "ramakant.mishra@heidelbergcement.in"; 

        const managerMailOptions = {
            from: `"HeidelbergCement Security Desk" <security.desk@mycem.in>`,
            to: securityManagerEmail,
            subject: `🛡️ Security Log: Pass ${generatedPassId} Active`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #0f172a; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
                    
                    <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
                        <h2 style="font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin: 0;">MYCEM Security Registry</h2>
                        <span style="font-size: 11px; font-family: monospace; color: #64748b;">Live Entry Log</span>
                    </div>
                    
                    <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 16px 0;">This email serves as an automated verification record. The visitor detailed below has successfully completed gate check-in protocols and has entered the facility premises.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                        <thead>
                            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 8px 12px; text-align: left; color: #475569; font-weight: 600;">Field Description</th>
                                <th style="padding: 8px 12px; text-align: left; color: #475569; font-weight: 600;">System Record</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 12px; color: #64748b;">Pass ID</td><td style="padding: 10px 12px; color: #b91c1c; font-weight: 700; font-family: monospace;">${generatedPassId}</td></tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 12px; color: #64748b;">Entry Time</td><td style="padding: 10px 12px; font-weight: 500;">${formattedInTime}</td></tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 12px; color: #64748b;">Visitor Name</td><td style="padding: 10px 12px; font-weight: 500;">${data.name}</td></tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 12px; color: #64748b;">Company / Origin</td><td style="padding: 10px 12px;">${finalCompany}</td></tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 12px; color: #64748b;">Host Employee</td><td style="padding: 10px 12px;">${hostNameText}</td></tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 12px; color: #64748b;">Plant Area</td><td style="padding: 10px 12px; font-weight: 500; text-transform: uppercase;">${data.department_name || "General Access"}</td></tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 12px; color: #64748b;">Purpose</td><td style="padding: 10px 12px;">${data.purposeOfVisit || "Official"}</td></tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 12px; color: #64748b;">Group Count</td><td style="padding: 10px 12px;">${data.noOfPeople || 1} Person(s)</td></tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 12px; color: #64748b;">Safety Induction</td><td style="padding: 10px 12px; font-weight: 700; text-transform: uppercase; color: ${data.safetyInduction === "yes" ? "#16a34a" : "#dc2626"};">${data.safetyInduction || "no"}</td></tr>
                        </tbody>
                    </table>
                    
                    <div style="background-color: #fffbeb; color: #b45309; padding: 12px; border-radius: 6px; border: 1px solid #fef3c7; font-size: 12px; line-height: 1.4;">
                        <strong>Audit Note:</strong> This timestamp represents real-time gate entry clearance. The log string is archived permanently in your on-premise MongoDB instance.
                    </div>
                </div>
            `
        };

        transporter.sendMail(managerMailOptions).catch(err => {
            console.error("⚠️ Background Security Manager audit dispatch failed to send:", err);
        });

    } catch (emailErr) {
        console.error("⚠️ Error occurring within email automation pipeline:", emailErr);
    }

    res.status(201).json({
        success: true,
        message: "Visitor pass generated and checked in under MYCEM series",
        data: newPass
    });
});


/* Fetch Previous Visitor Info */
export const fetchPreviousPass = tryCatch(async (req, res) => {
    const { contactNo } = req.query;
    if (!contactNo) throw new AppError("Contact number is required", 400);

    const visitor = await VisitorPass.findOne({ visitor_contact_no: contactNo })
                                     .sort({ createdAt: -1 });

    if (!visitor) {
        return res.status(200).json({ success: false, message: "No data found", data: null });
    }

    const visitorObj = visitor.toObject();
    const resolvedAddress = visitorObj.company || visitorObj.address || visitorObj.visitor_company || "";
    
    visitorObj.company = resolvedAddress;
    visitorObj.address = resolvedAddress;

    res.status(200).json({ success: true, message: "Visitor found", data: visitorObj });
});

/* Get Full Details for Printing the Pass */
export const getVisitorPassDetails = tryCatch(async (req, res) => {
    const { passId } = req.params;

    if (!passId) {
        return res.status(400).json({ success: false, message: "Pass ID parameter is required" });
    }

    let pass = await VisitorPass.findOne({
        $or: [
            { passId: passId },
            { pass_id: passId }
        ]
    });

    if (!pass && passId.match(/^[0-9a-fA-F]{24}$/)) {
        pass = await VisitorPass.findById(passId);
    }

    if (!pass) {
        return res.status(404).json({ success: false, message: "Visitor pass not found" });
    }

    const passObj = pass.toObject();
    const resolvedAddress = passObj.company || passObj.address || passObj.visitor_company || "N/A";
    
    passObj.company = resolvedAddress;
    passObj.address = resolvedAddress;

    res.status(200).json({
        success: true,
        data: passObj,
    });
});