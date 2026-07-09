import Admin from '../models/Admin.js';
import { signToken } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

// POST /api/admin/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are both required.');
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');

  // Same message either way — otherwise this endpoint tells an attacker which
  // emails have accounts.
  if (!admin || !(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password.');
  }

  admin.lastLoginAt = new Date();
  await admin.save({ validateBeforeSave: false });

  res.json({
    success: true,
    token: signToken(admin._id),
    admin: { id: admin._id, name: admin.name, email: admin.email },
  });
});

// GET /api/admin/auth/me — lets the client confirm a stored token is still good.
export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    admin: { id: req.admin._id, name: req.admin.name, email: req.admin.email },
  });
});
