import mongoose from 'mongoose';

const infoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true }, // keep string like old app (or switch to ref later)
    state: { type: String, default: '' },
    information: { type: String, default: '' },
    color: { type: String, default: '#999999' },

    // S3/MinIO attachment (optional)
    image: {
      url: { type: String, default: null },
      key: { type: String, default: null },
      mime: { type: String, default: null },
      size: { type: Number, default: null }
    }
  },
  { timestamps: true }
);

export default mongoose.models.CategoryInfo || mongoose.model('CategoryInfo', infoSchema);
