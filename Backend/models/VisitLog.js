import mongoose from 'mongoose';

const visitLogSchema = new mongoose.Schema({
    unique_pass_id: { type: String, required: true },
    check_in_time: { type: Date, default: Date.now },
    check_out_time: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('VisitLog', visitLogSchema);