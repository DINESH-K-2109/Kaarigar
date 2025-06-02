import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getAuthUser, withAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

async function handler(req: NextRequest, authUser: any) {
  try {
    // Initialize variables
    let user = null;
    let dbType = '';
    
    // Try to find user in tradesmen database
    try {
      const conn = await connectDB('tradesmen');
      const collection = conn.collection('users');
      
      const tradesmanUser = await collection.findOne({ 
        _id: new mongoose.Types.ObjectId(authUser.id) 
      });
      
      if (tradesmanUser) {
        user = tradesmanUser;
        dbType = 'tradesmen';
      }
    } catch (error) {
      console.error('Error searching in tradesmen database:', error);
    }
    
    // If not found in tradesmen database, try customers database
    if (!user) {
      try {
        const conn = await connectDB('customers');
        const collection = conn.collection('users');
        
        const customerUser = await collection.findOne({ 
          _id: new mongoose.Types.ObjectId(authUser.id) 
        });
        
        if (customerUser) {
          user = customerUser;
          dbType = 'customers';
        }
      } catch (error) {
        console.error('Error searching in customers database:', error);
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          }
        }
      );
    }
    
    // Return user data without password
    const { password, ...userData } = user;
    
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: userData._id.toString(),
          name: userData.name,
          email: userData.email,
          role: userData.role,
          city: userData.city || '',
          phone: userData.phone || '',
          dbType
        }
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
    
    return response;
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  }
}

export const GET = withAuth(handler); 