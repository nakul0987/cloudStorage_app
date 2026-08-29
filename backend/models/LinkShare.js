import mongoose from 'mongoose';

const linkShareSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      enum: ['file', 'folder'],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer',
    },
    passwordHash: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('LinkShare', linkShareSchema);