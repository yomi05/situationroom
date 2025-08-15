import mongoose from 'mongoose';

const VoterSchema = new mongoose.Schema({
  state:  { type: String, required: true },
  male:   { type: mongoose.Schema.Types.Mixed, required: true },
  female: { type: mongoose.Schema.Types.Mixed, required: true },
  total:  { type: mongoose.Schema.Types.Mixed, required: true },
  year:   { type: Number, required: true }
}, { timestamps: true });

export default mongoose.models.Voter || mongoose.model('Voter', VoterSchema);
