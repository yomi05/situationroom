import mongoose from 'mongoose';

const IncidentReportSchema = new mongoose.Schema(
  {
    incident_report_key: { type: String, required: true, index: true },

    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, 'Enter a valid phone number'],
    },

    description: { type: String, required: true }, // HTML or plain text
    uploads: { type: [String], default: [] },      // array of URLs or object keys

    state: { type: String, required: true, trim: true },
    lga: { type: String, required: true, trim: true },
    ward: { type: String, required: true, trim: true },
    pollingunit: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

IncidentReportSchema.index({ state: 1, lga: 1, ward: 1 });

export default mongoose.models.IncidentReport ||
  mongoose.model('IncidentReport', IncidentReportSchema);
