import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  submissionKey:    { type: String, required: true },
  itemKey:          { type: String, required: true },
  submissionName:   { type: String },
  description:      { type: String },
  submissionValue:  { type: Array },
  ip:               { type: String },
  formId:           { type: String },
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
