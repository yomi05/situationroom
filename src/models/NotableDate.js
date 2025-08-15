import mongoose from 'mongoose';

const NotableDateSchema = new mongoose.Schema({
  date:        { type: String, required: true },
  observation: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.NotableDate || mongoose.model('NotableDate', NotableDateSchema);
