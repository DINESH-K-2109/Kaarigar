import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { IUser } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export function signJwtToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: MAX_AGE });
}

export function verifyJwtToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function setAuthCookie(token: string): void {
  const cookieStore = cookies();
  cookieStore.set({
    name: 'token',
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
  });
}

export function getAuthCookie(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get('token')?.value;
}

export function clearAuthCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete('token');
}

export async function getAuthUser(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    return verifyJwtToken(token);
  } catch (error) {
    return null;
  }
}

export function withAuth(handler: any) {
  return async (req: NextRequest) => {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return handler(req, user);
  };
}

export function withRole(handler: any, roles: string[]) {
  return async (req: NextRequest) => {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    return handler(req, user);
  };
} 