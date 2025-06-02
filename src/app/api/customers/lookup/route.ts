import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

/**
 * GET /api/customers/lookup
 * Direct lookup of a customer by ID
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID parameter is required' },
        { status: 400 }
      );
    }

    console.log('Looking up customer with ID:', id);
    
    // Connect to the customers database
    const conn = await connectDB('customers');
    
    // Try to find the user in the customers database
    try {
      const usersCollection = conn.collection('users');
      const user = await usersCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(id) 
      });
      
      if (user) {
        console.log('Found user in customers database:', user.name);
        return NextResponse.json(
          { 
            success: true, 
            name: user.name,
            email: user.email,
            phone: user.phone,
            source: 'customers'
          },
          { status: 200 }
        );
      }
    } catch (error) {
      console.error('Error checking customers database:', error);
    }
    
    // If we get here, no user was found
    return NextResponse.json(
      { success: false, message: 'No customer found with the provided ID' },
      { status: 404 }
    );
    
  } catch (error: any) {
    console.error('Error in customer lookup:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 