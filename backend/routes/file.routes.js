import express from 'express';
import File from '../models/File.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   POST /api/files/init
// @desc    Initialize a file record before upload
router.post('/init', async (req, res, next) => {
  try {
    const { name, mimeType, sizeBytes, folderId } = req.body;

    if (!name || !mimeType || !sizeBytes) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Name, mimeType, and sizeBytes are required' },
      });
    }

    // Storage Key layout: tenants/{ownerId}/folders/{folderId|root}/files/{fileUuid}-{slug}
    const fileUuid = new Date().getTime();
    const folderPath = folderId || 'root';
    const storageKey = `tenants/${req.user.id}/folders/${folderPath}/files/${fileUuid}-${name}`;

    const file = await File.create({
      name,
      mimeType,
      sizeBytes,
      storageKey,
      ownerId: req.user.id,
      folderId: folderId || null,
      status: 'uploading',
    });

    res.status(201).json({
      fileId: file._id,
      storageKey: file.storageKey,
      // For local development, send dummy upload instructions or presigned URL structure
      uploadUrl: `/api/files/mock-upload/${file._id}`,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/files/complete
// @desc    Mark upload status as ready
router.post('/complete', async (req, res, next) => {
  try {
    const { fileId, checksum } = req.body;

    const file = await File.findOneAndUpdate(
      { _id: fileId, ownerId: req.user.id },
      { $set: { status: 'ready', ...(checksum && { checksum }) } },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
    }

    res.json({ message: 'Upload completed', file });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/files/:id
// @desc    Get file details
router.get('/:id', async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, ownerId: req.user.id, isDeleted: false });

    if (!file) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
    }

    res.json({ file });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/files/:id
// @desc    Rename or move a file
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, folderId } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (folderId !== undefined) updates.folderId = folderId;

    const file = await File.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id, isDeleted: false },
      { $set: updates },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
    }

    res.json({ file });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/files/:id
// @desc    Soft-delete a file
router.delete('/:id', async (req, res, next) => {
  try {
    const file = await File.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
    }

    res.json({ message: 'File moved to trash', file });
  } catch (error) {
    next(error);
  }
});

export default router;