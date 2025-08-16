import mongoose from 'mongoose';

const politicalPartySchema = new mongoose.Schema({
  pp_name:        { type: String, required: true, trim: true },
  pp_acronym:     { type: String, required: true, trim: true },
  pp_founded:     { type: String, trim: true },
  pp_image:       { type: String, default: null }, // public URL
  pp_image_key:   { type: String, default: null }, // S3 object key
  pp_description: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.PoliticalParty ||
  mongoose.model('PoliticalParty', politicalPartySchema);
