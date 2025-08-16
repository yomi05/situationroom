import mongoose from 'mongoose';

const HorElectionSchema = new mongoose.Schema(
  {
    state:        { type: String, required: true, trim: true, index: true },
    constituency: { type: String, required: true, trim: true, index: true },
    year:         { type: Number, required: true, index: true },
    party:        { type: String, required: true, trim: true },
    candidate:    { type: String, required: true, trim: true },
    // Allow string like "1,234,567" or number; we’ll cast in UI
    votes:        { type: mongoose.Schema.Types.Mixed, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.HorElection
  || mongoose.model('HorElection', HorElectionSchema);
