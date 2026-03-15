import * as crypto from 'crypto';

// For production, use bcrypt: import bcrypt from 'bcryptjs'
// For now, using crypto for placeholder implementation

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production_12345';

// Simple JWT implementation (for production, use jsonwebtoken package)
interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'client';
  iat?: number;
  exp?: number;
}

// Hash password (placeholder - in production use bcrypt)
export function hashPassword(password: string): string {
  // Simple hash for development - DO NOT USE IN PRODUCTION
  return crypto
    .createHash('sha256')
    .update(password + JWT_SECRET)
    .digest('hex');
}

// Compare password (placeholder)
export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Create JWT token
export function createToken(payload: JWTPayload): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + 24 * 60 * 60 // 24 hours
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Extract token from Authorization header
export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}
