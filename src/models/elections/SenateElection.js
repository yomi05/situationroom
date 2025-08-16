import mongoose from 'mongoose';

const SenateElectionSchema = new mongoose.Schema(
  {
    state:     { type: String, required: true, trim: true, index: true },
    district:  { type: String, required: true, trim: true, index: true },
    year:      { type: Number, required: true, index: true },

    party:     { type: String, required: true, trim: true },
    candidate: { type: String, required: true, trim: true },

    // Accepts "1,234,567" or Number
    votes:     { type: mongoose.Schema.Types.Mixed, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.SenateElection
  || mongoose.model('SenateElection', SenateElectionSchema);
