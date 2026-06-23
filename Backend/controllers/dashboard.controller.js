import VisitorPass from "../models/VisitorPass.js";
import VisitLog from "../models/VisitLog.js";
import {Department} from "../models/Department.js";
import { tryCatch } from "../utils/tryCatch.js";

export const getDashboardStats = tryCatch(async (req, res, next) => {
  const { filter } = req.query;
  
  let startDate, endDate;

  if (filter === "month") {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else {
    // 🟢 1. Explicitly isolate the exact start and end of day in local time
    const startOfISTDay = new Date();
    startOfISTDay.setHours(0, 0, 0, 0);

    const endOfISTDay = new Date();
    endOfISTDay.setHours(23, 59, 59, 999);

    // 🟢 2. Use + instead of - to correctly offset the negative timezone value (-330)
    startDate = new Date(startOfISTDay.getTime() + (startOfISTDay.getTimezoneOffset() * 60000));
    endDate = new Date(endOfISTDay.getTime() + (endOfISTDay.getTimezoneOffset() * 60000));
  }

  // --- 2. Counters (Fixed for Absolute Alignment with History) ---
  
  // A. Get distinct array of visitor names to count unique individuals across all time
  const uniqueVisitors = await VisitorPass.distinct("visitor_name");
  const totalUniqueCount = uniqueVisitors.length;

  // B. Count Active Inside right now (status: 1)
  const activeNowCount = await VisitorPass.countDocuments({ status: 1 });

  // 🟢 C. FIXED LOGIC: Get unique names matching today's strict IST window
  // This ensures a visitor is only counted ONCE for today, even if they have 3 passes.
  const todayUniquePeople = await VisitorPass.distinct("visitor_name", {
    createdAt: { $gte: startDate, $lte: endDate } 
  });
  const todayTotalCount = todayUniquePeople.length; // 🟢 Takes the length of unique names array

  // --- 3. Department Breakdown ---
  const departmentStats = await VisitorPass.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: "$department_to_visit", visitor_count: { $sum: 1 } } },
    { $project: { _id: 0, department_name: { $ifNull: ["$_id", "N/A"] }, visitor_count: 1 } }
  ]);

  // --- 4. Recent Visitors (IST Boundaried & Deduplicated) ---
  const recentVisitors = await VisitorPass.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$visitor_name", 
        doc: { $first: "$$ROOT" } 
      }
    },
    { $replaceRoot: { newRoot: "$doc" } },
    { $sort: { createdAt: -1 } },
    { $limit: 5 }
  ]);

  // 5. Response Construction
  res.status(200).json({
    success: true,
    message: "Fetched Dashboard Stats data successfully in IST format.",
    stats: {
      total: totalUniqueCount,   // 🟢 Changes Total Visitors from 4 to 2
      active: activeNowCount,     // 🟢 Displays 0
      completed: todayTotalCount, // 🟢 Changes Today's Total from 2 to 1
      departmentStats,
      recentVisitors 
    }
  });
});