import VisitorPass from "../models/VisitorPass.js"; 
import { tryCatch } from "../utils/tryCatch.js";
import { AppError } from "../utils/AppError.js";

// --- AUTOMATED/MANUAL VISITOR CHECK-IN ---
export const visitorIn = tryCatch(async (req, res, next) => {
    const { passId } = req.body;
    
    const pass = await VisitorPass.findOneAndUpdate(
        { 
            $or: [
                { passId: passId ? passId.trim() : "" },
                { pass_id: passId ? passId.trim() : "" }
            ]
        },
        { status: 1, check_in_time: new Date() },
        { new: true }
    );

    if (!pass) return next(new AppError("Visitor pass not found", 404));

    res.status(200).json({ success: true, message: "Checked In successfully", data: pass });
});

// --- MANUAL EXIT / CHECK-OUT ---
export const visitorOut = tryCatch(async (req, res, next) => {
    const { passId } = req.body; 

    if (!passId) {
        return res.status(400).json({ success: false, message: "Pass ID is required" });
    }

    const sanitizedPassId = passId.trim().toUpperCase();

    // Update the record inside your Atlas cluster
    const updatedPass = await VisitorPass.findOneAndUpdate(
        { 
            $or: [
                { passId: sanitizedPassId },
                { pass_id: sanitizedPassId }
            ]
        },
        {
            $set: {
                status: 2, 
                // 🟢 CRITICAL FIXED FIELDS: Make sure these are written exactly like this!
                check_out_time: new Date(), 
                exit_time: new Date()
            }
        },
        { new: true } // Tells Mongoose to return the updated record data
    );

    if (!updatedPass) {
        return res.status(404).json({ 
            success: false, 
            message: `No active inside visitor found matching Pass ID: ${sanitizedPassId}` 
        });
    }

    return res.status(200).json({
        success: true,
        message: "Gate Checkout Authorized Successfully",
        data: updatedPass
    });
});
// --- FETCH ORIGINAL LOGS (🟢 FIXED: Filters out master profiles to prevent duplicates) ---
export const getVisitorLogs = tryCatch(async (req, res, next) => {
    const now = new Date();
  
    const startOfISTDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    startOfISTDay.setMinutes(startOfISTDay.getMinutes() - 330);

    const endOfISTDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    endOfISTDay.setMinutes(endOfISTDay.getMinutes() - 330);

    const logs = await VisitorPass.aggregate([
        // 🟢 THE CRITICAL FIX: Match today's items but strictly force status to be 1 (Inside) or 2 (Checked Out)
        // This drops "PROFILE-xxxxx" records out entirely!
        { 
            $match: { 
                createdAt: { $gte: startOfISTDay, $lte: endOfISTDay },
                status: { $in: [1, 2, "1", "2"] } 
            } 
        },
        
        { $sort: { createdAt: -1, updatedAt: -1 } },
        
        {
            $group: {
                _id: "$passId", 
                doc: { $first: "$$ROOT" } 
            }
        },
        
        { $replaceRoot: { newRoot: "$doc" } },
        { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({ success: true, data: logs });
});

// --- FETCH GROUPED DAILY LOGS (🟢 FIXED: Filters out master profiles) ---
export const getDailyGroupedLogs = tryCatch(async (req, res) => {
    const now = new Date();
    
    const startOfISTDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    startOfISTDay.setMinutes(startOfISTDay.getMinutes() - 330); 

    const endOfISTDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    endOfISTDay.setMinutes(endOfISTDay.getMinutes() - 330); 

    const logs = await VisitorPass.aggregate([
        // 🟢 THE CRITICAL FIX: Only capture active operational passes
        { 
            $match: { 
                createdAt: { $gte: startOfISTDay, $lte: endOfISTDay },
                status: { $in: [1, 2, "1", "2"] }
            } 
        },
        { $sort: { status: 1, updatedAt: -1, createdAt: -1 } },
        {
            $group: {
                _id: "$passId", 
                doc: { $first: "$$ROOT" } 
            }
        },
        { $replaceRoot: { newRoot: "$doc" } },
        { $sort: { status: 1, createdAt: -1 } }
    ]);

    res.status(200).json({ success: true, data: logs });
});

// --- FETCH COUNTER METRICS (🟢 NEW: Synchronized Dashboard Metric Calculator) ---
// Hook this endpoint to your top stats cards row to make the UI numbers line up exactly!
export const getGateMetrics = tryCatch(async (req, res) => {
    const now = new Date();
    
    const startOfISTDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    startOfISTDay.setMinutes(startOfISTDay.getMinutes() - 330); 

    const endOfISTDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    endOfISTDay.setMinutes(endOfISTDay.getMinutes() - 330);

    // 1. Total Gate Logs Today (Only active tracking slips)
    const totalGateLogs = await VisitorPass.countDocuments({
        createdAt: { $gte: startOfISTDay, $lte: endOfISTDay },
        status: { $in: [1, 2] }
    });

    // 2. Presently Inside (All visitors currently sitting inside at status 1)
    const presentlyInside = await VisitorPass.countDocuments({
        status: 1
    });

    // 3. Cleared Out Today (Passes checked out during today's shift timeline)
    const clearedOut = await VisitorPass.countDocuments({
        createdAt: { $gte: startOfISTDay, $lte: endOfISTDay },
        status: 2
    });

    res.status(200).json({
        success: true,
        data: {
            totalLogs: totalGateLogs,
            inside: presentlyInside,
            outside: clearedOut
        }
    });
});