import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  title:       { type: String },
  description: { type: String },
  color:       { type: String }
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
