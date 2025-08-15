// src/models/SenatorialElection.js
import mongoose from 'mongoose';

const SenatorialElectionSchema = new mongoose.Schema({
  state:      { type: String, required: true },
  year:       { type: Number, required: true },
  party:      { type: String, required: true },
  candidate:  { type: String, required: true },
  votes:      { type: mongoose.Schema.Types.Mixed, required: true, default: 0 },
  district:   { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.SenatorialElection || mongoose.model('SenatorialElection', SenatorialElectionSchema);
