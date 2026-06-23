import mongoose from "mongoose";

const VisitorPassSchema = new mongoose.Schema({
    passId: { type: String, required: true, unique: true },
    pass_id: { type: String },
    visitorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    visitor_name: { type: String, required: true },
    visitor_contact_no: { type: String, required: true },
    visitor_email: { type: String },
    visitor_photo: { type: String },
    
    company: { type: String, default: "N/A" },
    address: { type: String, default: "N/A" },

    // Underlying tracking tokens/IDs sent by selectors
    departmentTo: { type: String },
    department_to_visit: { type: String },
    employeeTo: { type: String },
    employee_to_visit: { type: String },
    
    // 🟢 NEWLY ADDED CLEAN-TEXT FIELDS FOR DIRECT DISK PERSISTENCE:
    // This allows table grids to load names instantly without slow population joins!
    employee_name: { type: String, default: "Official Staff" },
    department_name: { type: String, default: "General Operations" },

    purposeOfVisit: { type: String, default: "OFFICIAL" },
    purpose_of_visit: { type: String, default: "OFFICIAL" },
    
    allowOn: { type: Date, default: Date.now },
    allow_on: { type: Date, default: Date.now },
    allowTill: { type: Date },
    allow_till: { type: Date },
    
    no_of_people: { type: Number, default: 1 },
    status: { type: Number, default: 1 },
    check_in_time: { type: Date, default: Date.now },

    safety_induction: { 
        type: String, 
        enum: ["yes", "no"], 
        default: "no" 
    },
    ppe_info: { 
        type: [String], 
        default: [] 
    }
    
}, { timestamps: true });

const VisitorPass = mongoose.models.VisitorPass || mongoose.model("VisitorPass", VisitorPassSchema, "visitorpasses");

export default VisitorPass;