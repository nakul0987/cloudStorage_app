import express from 'express';
import File from '../models/File.js';
import Folder from '../models/Folder.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/search?q=
// @desc    Search files and folders by name
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({ files: [], folders: [] });
    }

    const regex = new RegExp(q, 'i');

    const files = await File.find({ ownerId: req.user.id, name: regex, isDeleted: false });
    const folders = await Folder.find({ ownerId: req.user.id, name: regex, isDeleted: false });

    res.json({ files, folders });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/trash
// @desc    List soft-deleted files and folders
router.get('/trash', async (req, res, next) => {
  try {
    const files = await File.find({ ownerId: req.user.id, isDeleted: true });
    const folders = await Folder.find({ ownerId: req.user.id, isDeleted: true });

    res.json({ files, folders });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/trash/restore
// @desc    Restore item from trash
router.post('/trash/restore', async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.body;

    if (resourceType === 'file') {
      await File.findOneAndUpdate({ _id: resourceId, ownerId: req.user.id }, { $set: { isDeleted: false } });
    } else if (resourceType === 'folder') {
      await Folder.findOneAndUpdate({ _id: resourceId, ownerId: req.user.id }, { $set: { isDeleted: false } });
    } else {
      return res.status(400).json({ error: { code: 'INVALID_TYPE', message: 'Invalid resourceType' } });
    }

    res.json({ message: 'Item restored successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;