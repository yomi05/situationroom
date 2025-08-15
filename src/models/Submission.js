import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema(
  {
    submission_key: { type: String, required: true, index: true }, // uuid
    item_key: { type: String, required: true },                    // uuid
    submission_name: { type: String },
    description: { type: String },
    submission_value: { type: Array, default: [] }, // [{ field_id, field_value }]
    ip: { type: String },
    form_id: { type: String }, // stores form_key (to match legacy)
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
