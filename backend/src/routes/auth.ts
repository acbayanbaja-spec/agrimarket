import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { registerSchema, loginSchema } from '../validators/authValidator';
import { authService } from '../services/authService';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      phone,
    });
    
    res.status(201).json(successResponse(result, 'User registered successfully'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message, null, 'REGISTRATION_FAILED', 400));
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login({ email, password });
    
    res.json(successResponse(result, 'Login successful'));
  } catch (error: any) {
    res.status(401).json(errorResponse(error.message, null, 'LOGIN_FAILED', 401));
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, (req, res) => {
  // In a real implementation, you might want to invalidate the token
  // For JWT, this is typically handled by token expiration
  res.json(successResponse(null, 'Logout successful'));
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await authService.getUserById(req.user!.id);
    
    if (!user) {
      return res.status(404).json(errorResponse('User not found', null, 'USER_NOT_FOUND', 404));
    }
    
    return res.json(successResponse(user, 'User retrieved successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message, null, 'GET_USER_FAILED', 500));
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', (req, res) => {
  res.json({ message: 'Refresh token endpoint - to be implemented' });
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', (req, res) => {
  res.json({ message: 'Forgot password endpoint - to be implemented' });
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', (req, res) => {
  res.json({ message: 'Reset password endpoint - to be implemented' });
});

export default router;
