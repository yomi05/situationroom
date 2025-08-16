import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const GovernorshipElectionSchema = new mongoose.Schema(
  {
    past_election_governorship_key: { type: String, default: () => uuidv4(), index: true },

    state: { type: String, required: true, trim: true },
    year:  { type: Number, required: true, index: true },

    party:     { type: String, required: true, trim: true },
    candidate: { type: String, required: true, trim: true },
    deputy:    { type: String, trim: true },

    // Keep flexible to accept "1,234,567" or Number
    votes:     { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.GovernorshipElection
  || mongoose.model('GovernorshipElection', GovernorshipElectionSchema);
