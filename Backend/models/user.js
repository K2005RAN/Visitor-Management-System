import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    employee_id: { type: String, required: true, unique: true },
    employee_email: { type: String, required: true },
    contact_number: { type: String, required: true },
    manager_email: { type: String, required: true },
    department_id: { type: String, required: true }, 
    department_name: { type: String },
    password: { type: String, required: true }, // Added this
    role: { type: String, default: 'employee' }   // Added this
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;