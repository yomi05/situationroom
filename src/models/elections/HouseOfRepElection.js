// src/models/HouseOfRepElection.js
import mongoose from 'mongoose';

const HouseOfRepElectionSchema = new mongoose.Schema({
  state:        { type: mongoose.Schema.Types.Mixed, required: true },
  year:         { type: mongoose.Schema.Types.Mixed, required: true },
  party:        { type: mongoose.Schema.Types.Mixed, required: true },
  candidate:    { type: mongoose.Schema.Types.Mixed, required: true },
  constituency: { type: mongoose.Schema.Types.Mixed, required: true },
  votes:        { type: mongoose.Schema.Types.Mixed, required: true, default: 0 }
}, { timestamps: true });

export default mongoose.models.HouseOfRepElection || mongoose.model('HouseOfRepElection', HouseOfRepElectionSchema);
