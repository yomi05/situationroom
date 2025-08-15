// /src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema(
  {
    // Clean canonical field names, with aliases for legacy docs
    firstName: { type: String, required: true, trim: true, alias: 'first_name' },
    lastName:  { type: String, required: true, trim: true, alias: 'last_name' },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email'],
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, 'Enter a valid phone number'],
    },

    // Hidden by default; explicitly select with .select('+password')
    password: { type: String, required: true, select: false },

    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
    disability: { type: Boolean, default: false },
    state: { type: String, trim: true },

    role: { type: String, default: 'Guest' },

    // Standard name; alias supports your old `email_verified_at`
    emailVerified: { type: Date, default: null, alias: 'email_verified_at' },

    // Single pair of reset fields (avoid duplicates)
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

/** Virtuals */
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName ?? ''} ${this.lastName ?? ''}`.trim();
});

/** Methods */
UserSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generatePasswordReset = function (ttlMinutes = 30) {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');

  this.resetPasswordToken = hashed;
  this.resetPasswordExpires = new Date(Date.now() + ttlMinutes * 60 * 1000);

  return raw; // send this to the user via email
};

/** Pre-save hashing */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/** Hash password in findOneAndUpdate flows (when password is being changed) */
UserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate?.() || {};
  const nextVal = update.$set?.password ?? update.password;
  if (!nextVal) return next();

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(nextVal, salt);

  // Ensure we write to $set
  const $set = { ...(update.$set || {}), password: hashed };
  delete update.password;
  this.setUpdate({ ...update, $set });

  next();
});

/** Clean JSON output */
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
