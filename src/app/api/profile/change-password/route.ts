import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { withAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function handler(req: NextRequest, authUser: any) {
  try {
    if (req.method !== 'PUT') {
      return NextResponse.json(
        { success: false, message: 'Method not allowed' },
        { status: 405 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password should be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find the user in either database
    let user = null;
    let userDb = '';
    
    // Try to find in customers database
    try {
      const conn = await connectDB('customers');
      const collection = conn.collection('users');
      
      user = await collection.findOne({ 
        _id: new mongoose.Types.ObjectId(authUser.id) 
      });
      
      if (user) {
        userDb = 'customers';
      }
    } catch (error) {
      console.error('Error searching in customers database:', error);
    }
    
    // If not found, try tradesmen database
    if (!user) {
      try {
        const conn = await connectDB('tradesmen');
        const collection = conn.collection('users');
        
        user = await collection.findOne({ 
          _id: new mongoose.Types.ObjectId(authUser.id) 
        });
        
        if (user) {
          userDb = 'tradesmen';
        }
      } catch (error) {
        console.error('Error searching in tradesmen database:', error);
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in the correct database
    try {
      const conn = await connectDB(userDb as 'customers' | 'tradesmen');
      const collection = conn.collection('users');
      
      await collection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          } 
        }
      );
    } catch (error) {
      console.error(`Error updating password in ${userDb} database:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Password updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(handler); 