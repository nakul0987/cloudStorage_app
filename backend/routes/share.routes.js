import express from 'express';
import Share from '../models/Share.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   POST /api/shares
// @desc    Share a file or folder with another user by email
router.post('/', async (req, res, next) => {
  try {
    const { resourceType, resourceId, granteeEmail, role } = req.body;

    if (!resourceType || !resourceId || !granteeEmail) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'resourceType, resourceId, and granteeEmail are required' },
      });
    }

    const granteeUser = await User.findOne({ email: granteeEmail });
    if (!granteeUser) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User to share with was not found' } });
    }

    const share = await Share.create({
      resourceType,
      resourceId,
      granteeUserId: granteeUser._id,
      role: role || 'viewer',
      createdBy: req.user.id,
    });

    res.status(201).json({ share });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: { code: 'ALREADY_SHARED', message: 'Resource is already shared with this user' },
      });
    }
    next(error);
  }
});

// @route   GET /api/shares/:resourceType/:resourceId
// @desc    List all users with direct access to a resource
router.get('/:resourceType/:resourceId', async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.params;

    const shares = await Share.find({ resourceType, resourceId }).populate('granteeUserId', 'name email imageUrl');

    res.json({ shares });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/shares/:id
// @desc    Revoke share access
router.delete('/:id', async (req, res, next) => {
  try {
    const share = await Share.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });

    if (!share) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Share rule not found' } });
    }

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;