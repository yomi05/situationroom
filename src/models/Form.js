import mongoose from 'mongoose';

const FormSchema = new mongoose.Schema({
  form_id: { type: String, required: true },
  form_key: { type: String, required: true },            // keep for backward compatibility
  slug: { type: String, unique: true, index: true },     // NEW
  form_name: { type: String, required: true },
  form_description: { type: String, default: '' },
  is_editable: { type: Number, default: 0 },
    is_pollingform: { type: Number, default: 0 },
  is_template: { type: Number, default: 0 },
  is_loggedin: { type: Boolean, default: false },
  status: { type: String, default: 'Active' },
 
user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  fields: { type: Array, default: [] }
}, { timestamps: true });

function slugifyBase(str) {
  return (str || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')  // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60);
}

async function generateUniqueSlug(doc) {
  const base = slugifyBase(doc.form_name) || 'form';
  const rand = () => String(Math.floor(Math.random() * 1e5)).padStart(5, '0');
  let candidate = `${base}-${rand()}`;
  // ensure uniqueness
  // eslint-disable-next-line no-constant-condition
  for (let i = 0; i < 10; i++) {
    const exists = await mongoose.models.Form.findOne({ slug: candidate }).select('_id').lean();
    if (!exists) return candidate;
    candidate = `${base}-${rand()}`;
  }
  // worst case, include timestamp
  return `${base}-${Date.now().toString().slice(-5)}`;
}

FormSchema.pre('validate', async function () {
  if (!this.slug && this.form_name) {
    this.slug = await generateUniqueSlug(this);
  }
});

// If name changes and you want a fresh slug, uncomment the next lines:
// FormSchema.pre('save', async function () {
//   if (this.isModified('form_name')) {
//     this.slug = await generateUniqueSlug(this);
//   }
// });

export default mongoose.models.Form || mongoose.model('Form', FormSchema);
