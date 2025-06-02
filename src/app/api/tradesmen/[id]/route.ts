import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getTradesmanModel } from '@/models/Tradesman';
import { getUserModel } from '@/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to the tradesmen database
    await connectDB('tradesmen');
    
    const tradesmanId = params.id;
    
    // Get the Tradesman model from the tradesmen database
    const TradesmanModel = await getTradesmanModel();
    
    // Also get the User model since we need to ensure it's registered for populate
    await getUserModel('tradesman');
    
    const tradesman = await TradesmanModel.findById(tradesmanId).populate(
      'user',
      'name email phone city'
    );
    
    if (!tradesman) {
      return NextResponse.json(
        { success: false, message: 'Tradesman not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        data: tradesman,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Tradesman detail error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 