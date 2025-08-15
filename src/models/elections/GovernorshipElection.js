// src/models/GovernorshipElection.js
import mongoose from 'mongoose';

const GovernorshipElectionSchema = new mongoose.Schema({
  key:       { type: String, required: true },
  state:     { type: String, required: true },
  year:      { type: String },
  party:     { type: String, required: true },
  candidate: { type: String, required: true },
  deputy:    { type: String },
  votes:     { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.models.GovernorshipElection || mongoose.model('GovernorshipElection', GovernorshipElectionSchema);
