import mongoose from 'mongoose';

const FormSchema = new mongoose.Schema({
  formId:        { type: String, required: true },
  formKey:       { type: String, required: true },
  formName:      { type: String, required: true },
  formDescription: { type: String },
  isEditable:    { type: Boolean, default: false },
  isTemplate:    { type: Boolean, default: false },
  isLoggedIn:    { type: Boolean, default: false },
  status:        { type: String, default: 'Active' },
  userId:        { type: String, required: true },
  fields:        { type: Array, default: [] }
}, { timestamps: true });

export default mongoose.models.Form || mongoose.model('Form', FormSchema);
