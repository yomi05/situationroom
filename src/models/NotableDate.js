import mongoose from 'mongoose';

const NotableDateSchema = new mongoose.Schema(
  {
    // Store as "d-MMM", e.g. "1-Jan"
    date: { type: String, required: true },
    observation: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.NotableDate
  || mongoose.model('NotableDate', NotableDateSchema);
