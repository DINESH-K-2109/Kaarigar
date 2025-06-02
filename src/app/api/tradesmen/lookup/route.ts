import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

/**
 * GET /api/tradesmen/lookup
 * Direct lookup of a tradesman by ID or userId
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

    console.log('Looking up tradesman with direct ID:', id);
    
    // Connect to the tradesmen database
    const conn = await connectDB('tradesmen');
    
    // Try both users and tradesmen collections
    let result = null;
    
    try {
      // First check users collection
      const usersCollection = conn.collection('users');
      result = await usersCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(id) 
      });
      
      if (result) {
        console.log('Found user in tradesmen/users collection:', result.name);
        return NextResponse.json(
          { 
            success: true, 
            name: result.name,
            email: result.email,
            phone: result.phone,
            source: 'users'
          },
          { status: 200 }
        );
      }
    } catch (error) {
      console.error('Error checking users collection:', error);
    }
    
    try {
      // Then check tradesmen collection
      const tradesmenCollection = conn.collection('tradesmen');
      
      // Try matching on multiple fields
      result = await tradesmenCollection.findOne({
        $or: [
          { _id: new mongoose.Types.ObjectId(id) },
          { user: new mongoose.Types.ObjectId(id) },
          { userId: id }
        ]
      });
      
      if (result) {
        console.log('Found tradesman in tradesmen collection:', result.name);
        return NextResponse.json(
          { 
            success: true, 
            name: result.name,
            email: result.email,
            phone: result.phone,
            source: 'tradesmen'
          },
          { status: 200 }
        );
      }
    } catch (error) {
      console.error('Error checking tradesmen collection:', error);
    }
    
    // Connect to customers database as a fallback
    try {
      const customersConn = await connectDB('customers');
      const usersCollection = customersConn.collection('users');
      
      result = await usersCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(id) 
      });
      
      if (result) {
        console.log('Found user in customers/users collection:', result.name);
        return NextResponse.json(
          { 
            success: true, 
            name: result.name,
            email: result.email,
            phone: result.phone,
            source: 'customers'
          },
          { status: 200 }
        );
      }
    } catch (error) {
      console.error('Error checking customers collection:', error);
    }
    
    // If we get here, no user was found
    return NextResponse.json(
      { success: false, message: 'No user found with the provided ID' },
      { status: 404 }
    );
    
  } catch (error: any) {
    console.error('Error in direct tradesman lookup:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 