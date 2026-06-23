import VisitorPass from "../models/VisitorPass.js";
// import { sendVisitorReportMail } from "../emailTemplates/visitorReport.template.js";
import { tryCatch } from "../utils/tryCatch.js";
import { AppError } from "../utils/AppError.js";

/**
 * 🟢 HELPER 1: Safely format string timestamps into true ISO Date Objects
 */
const parseFrontendToISODate = (dateStr) => {
  if (!dateStr) return new Date();
  
  // Handles YYYY-MM-DD HH:mm format variations safely if passed from pickers
  if (dateStr.includes("-") && !dateStr.includes("T")) {
    // Standardizes space split strings to safe ISO standards
    const standardizedStr = dateStr.replace(" ", "T");
    const parsedDate = new Date(standardizedStr);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
  }
  
  // Handshake fallback check for DD-MM-YYYY formats
  if (dateStr.includes("-") && !dateStr.includes("T")) {
    const [datePart, timePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("-");
    if (year && month && day) {
      const formattedISO = `${year}-${month}-${day}${timePart ? "T" : ""}${timePart || ""}`;
      const parsedDate = new Date(formattedISO);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }
  }

  return new Date(dateStr);
};

/**
 * 🟢 HELPER 2: Calculate duration between two dates in HH:MM:SS format
 */
const calculateDuration = (start, end) => {
  if (!start) return "00:00:00";
  const startTime = new Date(start);
  const endTime = end ? new Date(end) : new Date();
  
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return "00:00:00";
  
  const diffInSeconds = Math.floor((endTime - startTime) / 1000);
  if (diffInSeconds < 0) return "00:00:00";

  const hours = Math.floor(diffInSeconds / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = diffInSeconds % 60;

  return [hours, minutes, seconds]
    .map((v) => (v < 10 ? "0" + v : v))
    .join(":");
};

// Fetch Visitors (Report & Screen Populator Grid with Backend Search Filters)
export const fetchVisitors = tryCatch(async (req, res) => {
  const { startTime, endTime, exportFormat, searchQuery, searchField } = req.query;

  if (!startTime || !endTime) {
    throw new AppError("startTime and endTime are required query parameters", 400);
  }

  const startIso = parseFrontendToISODate(startTime);
  const endIso = parseFrontendToISODate(endTime);

  // 1. Build the base query with the mandatory date criteria thresholds
  let queryCondition = {
    createdAt: {
      $gte: startIso,
      $lte: endIso,
    },
    status: { $in: [1, 2, "1", "2"] }
  };

  // 2. DYNAMIC BACKEND SEARCH FILTER: Inject case-insensitive regex search if fields are filled
  if (searchQuery && searchQuery.trim() !== "") {
    const cleanSearch = searchQuery.trim();
    
    if (searchField === "name") {
      queryCondition.visitor_name = { $regex: cleanSearch, $options: "i" };
    } else if (searchField === "contactno") {
      queryCondition.visitor_contact_no = { $regex: cleanSearch, $options: "i" };
    } else if (searchField === "company") {
      queryCondition.company = { $regex: cleanSearch, $options: "i" };
    } else {
      // "all" option: checks if it matches name OR contact number OR company
      queryCondition.$or = [
        { visitor_name: { $regex: cleanSearch, $options: "i" } },
        { visitor_contact_no: { $regex: cleanSearch, $options: "i" } },
        { company: { $regex: cleanSearch, $options: "i" } }
      ];
    }
  }

  // Fetch the matching records matching our refined constraints
  const logs = await VisitorPass.find(queryCondition).sort({ createdAt: -1 });

  // Map database entries to match frontend column expectations cleanly
  const reportData = logs.map((log) => {
    const checkIn = log.check_in_time || log.createdAt;
    const checkOut = log.check_out_time || log.exit_time || (Number(log.status) === 2 ? log.updatedAt : null);

    return {
      id: log._id,
      visitor_name: log.visitor_name,
      visitor_contact_no: log.visitor_contact_no,
      company: log.company || "—",
      to_visit: log.employee_to_visit || log.employeeTo || "—",
      department_name: log.department_to_visit || log.departmentTo || "—",
      check_in_time: checkIn,
      check_out_time: checkOut,
      visit_duration: calculateDuration(checkIn, checkOut),
      status: Number(log.status) === 1 ? "INSIDE" : "CHECKED OUT",
      passId: log.passId || log.pass_id
    };
  });

  // CSV EXPORTER ROUTE: Automatically includes the searched constraints natively
  if (exportFormat === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=Heidelberg_Filtered_Report.csv`);

    let csvContent = "SR.,VISITOR NAME,CONTACT,COMPANY,TO VISIT,DEPT,CHECK IN,CHECK OUT,STATUS\n";
    
    reportData.forEach((row, index) => {
      const cleanIn = row.check_in_time ? new Date(row.check_in_time).toLocaleString("en-IN") : "—";
      const cleanOut = row.check_out_time ? new Date(row.check_out_time).toLocaleString("en-IN") : "—";
      
      csvContent += `${index + 1},"${row.visitor_name}","${row.visitor_contact_no}","${row.company}","${row.to_visit}","${row.department_name}","${cleanIn}","${cleanOut}","${row.status}"\n`;
    });

    return res.status(200).send(csvContent);
  }

  res.status(200).json({
    success: true,
    message: "Visitor report data fetched successfully",
    data: reportData,
    totalCount: reportData.length,
  });
});

// Send Visitor Report Email
export const sendVisitorReport = tryCatch(async (req, res) => {
  const { visitors } = req.body;

  if (!Array.isArray(visitors) || visitors.length === 0) {
    throw new AppError("No visitor data provided", 400);
  }

  const emailSent = await sendVisitorReportMail(visitors);

  if (!emailSent) {
    throw new AppError("Failed to send visitor report email", 500);
  }

  res.status(200).json({
    success: true,
    message: "Visitor report sent successfully",
  });
});