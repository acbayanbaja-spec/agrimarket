import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../database/store';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json(errorResponse('User not found', null, 'NOT_FOUND', 404));
    }

    const { password_hash, ...safeUser } = user;
    return res.json(successResponse(safeUser, 'Profile retrieved'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PROFILE_FETCH_FAILED', 500));
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, profile_image } = req.body;
    const updated = db.updateUser(req.user!.id, {
      first_name: firstName,
      last_name: lastName,
      phone,
      profile_image,
    });

    if (!updated) {
      return res.status(404).json(errorResponse('User not found', null, 'NOT_FOUND', 404));
    }

    const { password_hash, ...safeUser } = updated;
    return res.json(successResponse(safeUser, 'Profile updated successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'PROFILE_UPDATE_FAILED', 500));
  }
});

// @route   GET /api/users/:id
// @desc    Get public profile by ID
// @access  Public
router.get('/:id', (req, res: Response) => {
  try {
    const user = db.getUserById(Number(req.params.id));
    if (!user) {
      return res.status(404).json(errorResponse('User not found', null, 'NOT_FOUND', 404));
    }

    return res.json(
      successResponse(
        {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          roles: user.roles,
          is_verified: user.is_verified,
        },
        'User profile retrieved'
      )
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'USER_FETCH_FAILED', 500));
  }
});

export default router;
