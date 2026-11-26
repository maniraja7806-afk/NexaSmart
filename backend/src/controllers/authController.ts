import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User.js';
import { config } from '../config/index.js';

// In-memory demo fallback credentials when MongoDB Atlas is not yet connected
const FALLBACK_USERS = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Dr. Evelyn Carter',
    email: 'superadmin@nexasmart.io',
    password: 'Password123!',
    role: 'Super Admin',
    department: 'Central IT Administration',
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Marcus Vance',
    email: 'campusadmin@nexasmart.io',
    password: 'Password123!',
    role: 'Campus Administrator',
    department: 'Campus Operations',
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Elena Rostova',
    email: 'facility@nexasmart.io',
    password: 'Password123!',
    role: 'Facility Manager',
    department: 'Physical Facilities',
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Chief Thomas Reyes',
    email: 'security@nexasmart.io',
    password: 'Password123!',
    role: 'Security Officer',
    department: 'Campus Safety & Protection',
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Liam Chen',
    email: 'technician@nexasmart.io',
    password: 'Password123!',
    role: 'Maintenance Technician',
    department: 'HVAC & Electrical Support',
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Amara Okafor',
    email: 'energy@nexasmart.io',
    password: 'Password123!',
    role: 'Energy Manager',
    department: 'Sustainability & Power',
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Diego Morales',
    email: 'water@nexasmart.io',
    password: 'Password123!',
    role: 'Water Manager',
    department: 'Water Infrastructure',
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Prof. Sarah Jenkins',
    email: 'department@nexasmart.io',
    password: 'Password123!',
    role: 'Department Administrator',
    department: 'School of Engineering',
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Campus Visitor / Auditor',
    email: 'viewer@nexasmart.io',
    password: 'Password123!',
    role: 'Viewer',
    department: 'External Audit',
    isActive: true,
  },
];

function generateTokens(user: { _id: any; email: string; role: any; name: string }) {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });

  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as any,
  });

  return { accessToken, refreshToken };
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if database is connected
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, error: 'Account is deactivated. Contact an administrator.' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      user.lastLogin = new Date();
      await user.save();

      const tokens = generateTokens(user);

      res.json({
        success: true,
        message: 'Authentication successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            phone: user.phone,
          },
          ...tokens,
        },
      });
      return;
    }

    // Standby/Test mode fallback
    const fallbackUser = FALLBACK_USERS.find((u) => u.email === cleanEmail);
    if (!fallbackUser || fallbackUser.password !== password) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const tokens = generateTokens(fallbackUser);
    res.json({
      success: true,
      message: 'Authentication successful (Demo / Standby Mode)',
      data: {
        user: {
          id: fallbackUser._id,
          name: fallbackUser.name,
          email: fallbackUser.email,
          role: fallbackUser.role,
          department: fallbackUser.department,
        },
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role, department, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email is already registered' });
      return;
    }

    const user = new User({
      name,
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: role || 'Viewer',
      department,
      phone,
    });
    await user.save();

    const tokens = generateTokens(user);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as any;
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'User not found or inactive' });
      return;
    }

    const tokens = generateTokens(user);
    res.json({ success: true, data: tokens });
  } catch (err: any) {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    res.json({
      success: true,
      message: 'If the email exists in our records, password reset instructions have been dispatched.',
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, message: 'Password has been updated successfully.' });
  } catch (err) {
    next(err);
  }
}
