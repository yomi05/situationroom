import mongoose from 'mongoose';

const votersSchema = new mongoose.Schema({
  state:  { type: String, required: true, trim: true },
  male:   { type: mongoose.Schema.Types.Mixed, required: true },   // accepts "1,234" or 1234
  female: { type: mongoose.Schema.Types.Mixed, required: true },
  total:  { type: mongoose.Schema.Types.Mixed, required: true },
  year:   { type: Number, required: true },
}, { timestamps: true });

// helpful for querying
votersSchema.index({ state: 1, year: -1 });

export default mongoose.models.VoterRegistration ||
  mongoose.model('VoterRegistration', votersSchema);
