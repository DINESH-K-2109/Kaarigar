import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return handleLogout(req);
}

export async function POST(req: NextRequest) {
  return handleLogout(req);
}

async function handleLogout(req: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout successful',
      },
      { status: 200 }
    );
    
    // Clear the token cookie
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0), // Immediate expiration
    });
    
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 