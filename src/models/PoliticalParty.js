import mongoose from 'mongoose';

const PoliticalPartySchema = new mongoose.Schema({
  name:        { type: String, required: true },
  acronym:     { type: String, required: true },
  founded:     { type: String },
  image:       { type: String },
  description: { type: String }
}, { timestamps: true });

export default mongoose.models.PoliticalParty || mongoose.model('PoliticalParty', PoliticalPartySchema);
