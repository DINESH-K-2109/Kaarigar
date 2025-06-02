import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import getDefaultUserModel, { getUserModel, IUser } from '@/models/User';
import { signJwtToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    // Get the user role first to determine which database to connect to
    const body = await req.json();
    const { name, email, password, role, city, phone } = body;
    
    // Validate required fields
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { success: false, message: 'Name, email, phone number and password are required' },
        { status: 400 }
      );
    }
    
    // Validate phone number format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid phone number (10-15 digits)' },
        { status: 400 }
      );
    }
    
    // Determine which database to use based on role
    const dbType = role === 'tradesman' ? 'tradesmen' : 'customers';
    
    // Connect to appropriate database
    await connectDB(dbType);
    
    // Get appropriate User model
    const User = await getUserModel(role);
    
    // Check if user already exists with this email
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return NextResponse.json(
        { success: false, message: 'User already exists with this email' },
        { status: 409 }
      );
    }
    
    // Check if user already exists with this phone number
    const existingUserPhone = await User.findOne({ phone });
    if (existingUserPhone) {
      return NextResponse.json(
        { success: false, message: 'User already exists with this phone number' },
        { status: 409 }
      );
    }
    
    // Hash password manually to avoid double hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('Creating user with hashed password');
    
    // Create user directly with MongoDB to bypass Mongoose middleware
    const conn = await connectDB(dbType);
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      city,
      phone,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await conn.collection('users').insertOne(userData);
    const userId = result.insertedId;
    
    // Retrieve the full user document
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Failed to create user' },
        { status: 500 }
      );
    }
    
    // Prepare user data for response
    const userResponse = {
      id: user._id ? user._id.toString() : '',
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      city: user.city || '',
      phone: user.phone || '',
      dbType
    };
    
    // Generate JWT token
    const token = signJwtToken({
      id: userResponse.id,
      email: userResponse.email,
      role: userResponse.role,
    });
    
    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user: userResponse
      },
      { status: 201 }
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 