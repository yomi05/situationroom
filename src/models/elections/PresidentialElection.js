import mongoose from 'mongoose';

const PresidentialElectionSchema = new mongoose.Schema({
  pastElectionKey: { type: String, required: true },
  position:        { type: String, default: 'President' },
  year:            { type: Number, required: true },
  party:           { type: String, required: true },
  candidate:       { type: String, required: true },
  votes:           { type: mongoose.Schema.Types.Mixed },
  percentage:      { type: Number, required: true }
}, { timestamps: true });

export default mongoose.models.PresidentialElection || mongoose.model('PresidentialElection', PresidentialElectionSchema);
