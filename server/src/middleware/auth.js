import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { ApiError } from '../utils/ApiError.js';

// Guards every /api/admin/* route. Customer routes stay open by design.
export async function requireAdmin(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw new ApiError(401, 'You must be signed in to do that.');
    }

    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);

    // Re-read the admin each request so a deleted account can't keep using a
    // token that hasn't expired yet.
    const admin = await Admin.findById(payload.sub);
    if (!admin) throw new ApiError(401, 'This account no longer exists.');

    req.admin = admin;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'Your session expired. Please sign in again.'));
    }
    next(err);
  }
}

export function signToken(adminId) {
  return jwt.sign({ sub: adminId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
