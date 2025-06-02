import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { signJwtToken } from '@/lib/auth';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;
    
    // Validate required fields
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Email/phone and password are required' },
        { status: 400 }
      );
    }
    
    // Check if identifier is email or phone number
    const isEmail = identifier.includes('@');
    
    // Validate phone format if not email
    if (!isEmail) {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(identifier)) {
        return NextResponse.json(
          { success: false, message: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }
    
    console.log('Login attempt with:', isEmail ? 'email' : 'phone', identifier);
    
    // Create query based on identifier type
    const query = isEmail 
      ? { email: identifier } 
      : { phone: identifier };
    
    let user = null;
    let dbType = '';
    
    // Try direct MongoDB access for customers database
    try {
      const conn = await connectDB('customers');
      const collection = conn.collection('users');
      
      console.log('Searching in customers database with query:', JSON.stringify(query));
      const customerUser = await collection.findOne(query);
      
      if (customerUser) {
        console.log('User found in customers database');
        user = customerUser;
        dbType = 'customers';
      }
    } catch (error) {
      console.error('Error searching in customers database:', error);
    }
    
    // If not found, try tradesmen database
    if (!user) {
      try {
        const conn = await connectDB('tradesmen');
        const collection = conn.collection('users');
        
        console.log('Searching in tradesmen database with query:', JSON.stringify(query));
        const tradesmanUser = await collection.findOne(query);
        
        if (tradesmanUser) {
          console.log('User found in tradesmen database');
          user = tradesmanUser;
          dbType = 'tradesmen';
        }
      } catch (error) {
        console.error('Error searching in tradesmen database:', error);
      }
    }
    
    // If user not found in either database
    if (!user) {
      console.log('No user found with identifier:', identifier);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password directly with bcrypt
    console.log('Verifying password for user:', user.email);
    let isPasswordValid = false;
    
    try {
      if (user.password) {
        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid);
      } else {
        console.error('User has no password hash stored!');
      }
    } catch (error) {
      console.error('Error comparing passwords:', error);
    }
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Get user data for response and token
    const userData = {
      id: user._id.toString(),
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      city: user.city || '',
      phone: user.phone || '',
      dbType // Include which database the user was found in
    };
    
    // Generate JWT token
    const token = signJwtToken({
      id: userData.id,
      email: userData.email,
      role: userData.role
    });
    
    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: userData
      },
      { status: 200 }
    );
    
    // Set the token in cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 