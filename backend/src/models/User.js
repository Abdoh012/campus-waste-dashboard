import mongoose from 'mongoose';

/**
 * Dashboard operator. Credentials exist only to gate GET /api/bins — there is
 * no registration flow, no roles, no profile: the frontend contract uses
 * exactly `{ _id, email }` after login.
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    // select:false keeps the hash out of every normal query; login opts in.
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

/** The only user representation the API ever returns. */
userSchema.methods.toAuthDto = function toAuthDto() {
  return { _id: String(this._id), email: this.email };
};

export const User = mongoose.model('User', userSchema);
