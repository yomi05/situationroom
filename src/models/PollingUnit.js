import mongoose from 'mongoose';

const PollingUnitSchema = new mongoose.Schema(
  {
    state: { type: String, trim: true, required: true },
    lga: { type: String, trim: true, required: true },
    registration_area: { type: String, trim: true, required: true }, // ward
    polling_unit: { type: String, trim: true, required: true },
  },
  { timestamps: true }
);

PollingUnitSchema.index({ state: 1 });
PollingUnitSchema.index({ lga: 1 });
PollingUnitSchema.index({ registration_area: 1 });
PollingUnitSchema.index({ state: 1, lga: 1, registration_area: 1, polling_unit: 1 });

export default mongoose.models.PollingUnit ||
  mongoose.model('PollingUnit', PollingUnitSchema);
