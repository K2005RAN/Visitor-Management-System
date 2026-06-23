import VisitorPass from "../models/VisitorPass.js";
import VisitLog from "../models/VisitLog.js";
import { tryCatch } from "../utils/tryCatch.js";
import { AppError } from "../utils/AppError.js";

// --- 1. Get All Unique Visitors (Strict Operational Filtering) ---
export const getAllVisitors = tryCatch(async (req, res) => {
    const visitors = await VisitorPass.aggregate([
        // Filter out base profiles (status: 0) entirely from the pipeline pool!
        { 
            $match: { 
                status: { $in: [1, 2, "1", "2"] } 
            } 
        },

        // 1. Sort the remaining operational documents so that newer checkouts float to the top
        { $sort: { createdAt: -1, updatedAt: -1 } },
        
        // 2. Group records by unique name and phone match boundaries
        {
            $group: {
                _id: { 
                    name: "$visitor_name", 
                    phone: "$visitor_contact_no" 
                }, 
                docId: { $first: "$_id" },
                visitor_name: { $first: "$visitor_name" },
                visitor_photo: { $first: "$visitor_photo" },
                visitor_contact_no: { $first: "$visitor_contact_no" },
                company: { $first: "$company" },
                last_visit: { $first: "$createdAt" },
                
                // 🟢 UPDATED: Only extract properties if the visitor has actually processed an exit.
                // We completely dropped the placeholder "$allow_till" fallback which was leaking future dates!
                status: { $first: "$status" },
                // 🟢 CAPTURE THE UPDATED_AT TIMESTAMP
        updatedAt: { $first: "$updatedAt" },
                check_out_time: { 
                    $first: { 
                        $ifNull: ["$check_out_time", { $ifNull: ["$exit_time", ""] }] 
                    } 
                },
                
                // Only count unique days to avoid double-counting same-day errors
                unique_days: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } }
            }
        },
        // 🟢 UPDATED VALUE PROJECTOR:
{
    $project: {
        _id: "$docId",
        visitor_name: 1,
        visitor_photo: 1,
        visitor_contact_no: 1,
        company: 1,
        last_visit: 1,
        status: 1,
        updatedAt: 1,
        
        // Check for both number and string representations of active inside status (1)
        check_out_time: {
            $cond: {
                if: { 
                    $or: [
                        { $eq: ["$status", 1] },
                        { $eq: ["$status", "1"] },
                        { $eq: ["$check_out_time", ""] }
                    ]
                },
                then: null,
                else: "$check_out_time"
            }
        },
        total_passes: { $size: "$unique_days" } 
    }
}
            ,
        { $sort: { last_visit: -1 } }
    ]);

    res.status(200).json({ success: true, data: visitors });
});

// --- 2. Get Detailed Visitor History ---
export const getVisitorDetails = tryCatch(async (req, res) => {
    const { visitorId } = req.params;

    if (!visitorId) {
        throw new AppError("Visitor ID is required", 400);
    }

    const visitorInfo = await VisitorPass.findById(visitorId);

    if (!visitorInfo) {
        throw new AppError("Visitor not found", 404);
    }

    const visitLogs = await VisitorPass.find({ 
        visitor_contact_no: visitorInfo.visitor_contact_no,
        status: { $in: [1, 2, "1", "2"] } 
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Visitor full history fetched successfully",
        visitor: visitorInfo,
        visit_logs: visitLogs,
    });
});