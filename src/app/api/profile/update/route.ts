import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { withAuth } from '@/lib/auth';
import mongoose from 'mongoose';

async function handler(req: NextRequest, authUser: any) {
  try {
    if (req.method !== 'PUT') {
      return NextResponse.json(
        { success: false, message: 'Method not allowed' },
        { status: 405 }
      );
    }

    const body = await req.json();
    const { name, city } = body;

    // Validate input
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    // Determine which database the user is in based on role
    let userDb = '';
    let userFound = false;

    // Try updating in customers database first
    try {
      const conn = await connectDB('customers');
      const collection = conn.collection('users');
      const objectId = new mongoose.Types.ObjectId(authUser.id);
      
      const result = await collection.updateOne(
        { _id: objectId },
        { 
          $set: { 
            name,
            city,
            updatedAt: new Date()
          } 
        }
      );
      
      if (result.matchedCount > 0) {
        userDb = 'customers';
        userFound = true;
      }
    } catch (error) {
      console.error('Error updating in customers database:', error);
    }

    // If not found in customers, try tradesmen database
    if (!userFound) {
      try {
        const conn = await connectDB('tradesmen');
        const collection = conn.collection('users');
        const objectId = new mongoose.Types.ObjectId(authUser.id);
        
        const result = await collection.updateOne(
          { _id: objectId },
          { 
            $set: { 
              name,
              city,
              updatedAt: new Date()
            } 
          }
        );
        
        if (result.matchedCount > 0) {
          userDb = 'tradesmen';
          userFound = true;
        }
      } catch (error) {
        console.error('Error updating in tradesmen database:', error);
      }
    }

    if (!userFound) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Profile updated successfully',
        dbType: userDb
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(handler); 