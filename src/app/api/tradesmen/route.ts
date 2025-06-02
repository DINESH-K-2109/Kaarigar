import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getTradesmanModel } from '@/models/Tradesman';
import { getUserModel } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    // Connect to the tradesmen database
    await connectDB('tradesmen');
    
    const url = new URL(req.url);
    const skills = url.searchParams.get('skills');
    const city = url.searchParams.get('city');
    const userId = url.searchParams.get('userId');
    
    const query: any = {};
    
    // If userId is provided, this takes precedence as we're looking for a specific tradesman
    if (userId) {
      query.userId = userId;
    } else {
      // Otherwise, handle the regular search filters
      if (city) {
        query.city = { $regex: city, $options: 'i' };
      }
      
      if (skills) {
        const skillsArray = skills.split(',').map(skill => skill.trim());
        query.skills = { $in: skillsArray };
      }
    }
    
    // Get the Tradesman model from the tradesmen database
    const TradesmanModel = await getTradesmanModel();
    
    // Also get the User model since we need to ensure it's registered for populate
    await getUserModel('tradesman');
    
    const tradesmen = await TradesmanModel.find(query)
      .populate('user', 'name email phone city')
      .sort({ rating: -1 });
    
    return NextResponse.json(
      {
        success: true,
        count: tradesmen.length,
        data: tradesmen,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Tradesman search error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 