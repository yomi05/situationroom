import mongoose from 'mongoose';

const CategoryInfoSchema = new mongoose.Schema({
  title:       { type: String },
  category:    { type: String },
  state:       { type: String },
  information: { type: String },
  image:       { type: String, default: null },
  color:       { type: String }
}, { timestamps: true });

export default mongoose.models.CategoryInfo || mongoose.model('CategoryInfo', CategoryInfoSchema);
