import express from 'express';
import Folder from '../models/Folder.js';
import File from '../models/File.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Helper to compute breadcrumb navigation path
const getBreadcrumbPath = async (folderId, userId) => {
  const path = [];
  let currentFolderId = folderId;

  while (currentFolderId) {
    const folder = await Folder.findOne({ _id: currentFolderId, ownerId: userId, isDeleted: false });
    if (!folder) break;
    path.unshift({ id: folder._id, name: folder.name });
    currentFolderId = folder.parentId;
  }

  return path;
};

// @route   POST /api/folders
// @desc    Create a new folder
router.post('/', async (req, res, next) => {
  try {
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Folder name is required' } });
    }

    const folder = await Folder.create({
      name,
      ownerId: req.user.id,
      parentId: parentId || null,
    });

    res.status(201).json({ folder });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: { code: 'DUPLICATE_NAME', message: 'A folder with this name already exists in this directory' },
      });
    }
    next(error);
  }
});

// @route   GET /api/folders/:id
// @desc    Get folder metadata, contents (folders & files), and path breadcrumbs
// Note: Pass 'root' as :id to get top-level contents
router.get('/:id', async (req, res, next) => {
  try {
    const folderId = req.params.id === 'root' ? null : req.params.id;

    let currentFolder = null;
    if (folderId) {
      currentFolder = await Folder.findOne({ _id: folderId, ownerId: req.user.id, isDeleted: false });
      if (!currentFolder) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Folder not found' } });
      }
    }

    const folders = await Folder.find({ ownerId: req.user.id, parentId: folderId, isDeleted: false }).sort({ name: 1 });
    const files = await File.find({ ownerId: req.user.id, folderId: folderId, isDeleted: false }).sort({ name: 1 });
    const path = folderId ? await getBreadcrumbPath(folderId, req.user.id) : [];

    res.json({
      folder: currentFolder,
      children: { folders, files },
      path,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/folders/:id
// @desc    Rename or move a folder
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, parentId } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (parentId !== undefined) updates.parentId = parentId;

    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!folder) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Folder not found' } });
    }

    res.json({ folder });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/folders/:id
// @desc    Soft-delete a folder
router.delete('/:id', async (req, res, next) => {
  try {
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Folder not found' } });
    }

    res.json({ message: 'Folder moved to trash', folder });
  } catch (error) {
    next(error);
  }
});

export default router;