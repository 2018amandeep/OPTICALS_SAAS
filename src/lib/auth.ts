import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_optiflow_key_2026_jwt_token';

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function signToken(payload: { shopId: string; email: string; name: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Get Authenticated Shop User from Request
export async function getAuthUser(req: NextRequest): Promise<{ shopId: string; email: string; name: string } | null> {
  // 1. Try to get token from cookies
  const cookieToken = req.cookies.get('auth_token')?.value;
  
  // 2. Try to get token from Authorization header
  let authHeaderToken = '';
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    authHeaderToken = authHeader.substring(7);
  }
  
  const token = cookieToken || authHeaderToken;
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}
