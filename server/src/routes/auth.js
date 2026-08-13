import express from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { UserWorkspaceRole } from '../models/UserWorkspaceRole.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken
} from '../utils/jwt.js';

const router = express.Router();

// Rate limiter for authentication routes (login/register)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 attempts per IP per 15 minutes
  message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Helper to generate a URL slug from workspace name
const createSlug = (name) => {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base}-${Math.random().toString(36).substring(2, 7)}`;
};

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, workspaceName, inviteSlug } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName: fullName.trim()
    });

    await user.save();

    let workspace;
    let userRole = 'admin';

    if (inviteSlug) {
      workspace = await Workspace.findOne({ slug: inviteSlug.toLowerCase().trim() });
      if (!workspace) {
        return res.status(404).json({ error: 'Invited workspace not found.' });
      }
      userRole = 'member';
    } else {
      const nameToUse = workspaceName ? workspaceName.trim() : `${fullName.trim()}'s Workspace`;
      workspace = new Workspace({
        name: nameToUse,
        slug: createSlug(nameToUse),
        ownerId: user._id
      });
      await workspace.save();
    }

    await UserWorkspaceRole.create({
      userId: user._id,
      workspaceId: workspace._id,
      role: userRole
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = hashToken(refreshToken);

    user.refreshTokens.push({ tokenHash });
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName
      },
      accessToken,
      workspace: {
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration process.' });
  }
});

// POST /auth/login
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    // Fetch user's workspace roles
    const roles = await UserWorkspaceRole.find({ userId: user._id }).populate('workspaceId');
    const workspaces = roles
      .filter((r) => r.workspaceId)
      .map((r) => ({
        id: r.workspaceId._id,
        name: r.workspaceId.name,
        slug: r.workspaceId.slug,
        role: r.role
      }));

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = hashToken(refreshToken);

    user.refreshTokens.push({ tokenHash });
    // Keep max 10 refresh tokens to prevent unbounded array growth
    if (user.refreshTokens.length > 10) {
      user.refreshTokens = user.refreshTokens.slice(-10);
    }
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName
      },
      accessToken,
      workspaces
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login process.' });
  }
});

// POST /auth/refresh (Token rotation)
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token cookie missing.' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User associated with token no longer exists.' });
    }

    const incomingHash = hashToken(refreshToken);
    const tokenIndex = user.refreshTokens.findIndex((t) => t.tokenHash === incomingHash);

    if (tokenIndex === -1) {
      // Possible token reuse attack detected: clear all refresh tokens for safety
      user.refreshTokens = [];
      await user.save();
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      return res.status(403).json({ error: 'Token reuse detected. Session revoked for security.' });
    }

    // Rotate: remove used refresh token and insert a new one
    user.refreshTokens.splice(tokenIndex, 1);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newHash = hashToken(newRefreshToken);

    user.refreshTokens.push({ tokenHash: newHash });
    await user.save();

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: 'Server error during token refresh.' });
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded) {
        const user = await User.findById(decoded.userId);
        if (user) {
          const incomingHash = hashToken(refreshToken);
          user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== incomingHash);
          await user.save();
        }
      }
    }

    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return res.status(200).json({ message: 'Successfully logged out.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Server error during logout.' });
  }
});

export default router;
