import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      enum: ['file', 'folder'],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    granteeUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      required: true,
      default: 'viewer',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate share grants to the same user for the same resource
shareSchema.index(
  { resourceType: 1, resourceId: 1, granteeUserId: 1 },
  { unique: true }
);

export default mongoose.model('Share', shareSchema);