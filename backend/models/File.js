import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null, // null means root directory
      index: true,
    },
    checksum: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['uploading', 'ready', 'failed'],
      default: 'uploading',
    },
  },
  { timestamps: true }
);

// Compound index for querying files in a specific folder
fileSchema.index({ ownerId: 1, folderId: 1, isDeleted: 1 });

// Text index for search operations
fileSchema.index({ name: 'text' });

export default mongoose.model('File', fileSchema);