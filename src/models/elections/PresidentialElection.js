import mongoose from 'mongoose';

const PresidentialElectionSchema = new mongoose.Schema(
  {
    past_election_key: { type: String, required: true },
    position: { type: String, default: 'President' },
    year: { type: Number, required: true, index: true },
    party: { type: String, required: true, trim: true },
    candidate: { type: String, required: true, trim: true },
    votes: { type: mongoose.Schema.Types.Mixed }, // may be "1,234,567" or Number
    percentage: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.PresidentialElection
  || mongoose.model('PresidentialElection', PresidentialElectionSchema);
