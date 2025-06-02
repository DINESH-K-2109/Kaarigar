import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getConversationModel, IConversation } from '@/models/Conversation';
import { withAuth } from '@/lib/auth';
import mongoose, { Types } from 'mongoose';

// Define interfaces for participant objects
interface IParticipant {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

interface IPopulatedConversation {
  _id: Types.ObjectId;
  participants: IParticipant[];
  lastMessage?: string;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * GET /api/conversations/[id]
 * Get a single conversation by ID with populated participants
 */
async function getConversationHandler(req: NextRequest, authUser: any) {
  try {
    // Extract conversation ID from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const conversationId = pathSegments[pathSegments.length - 1]; // Get the ID from the URL path
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Getting conversation details for ID: ${conversationId}`);
    
    // Connect to the default database
    await connectDB('default');
    
    // Get the Conversation model
    const Conversation = await getConversationModel();
    
    // Validate conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: authUser.id,
    });
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found or not authorized' },
        { status: 404 }
      );
    }
    
    // We need to manually populate the participants since they might be in different databases
    const unpopulatedConversation = conversation.toObject();
    // Cast participants to an array of ObjectIds
    const participantIds = unpopulatedConversation.participants.map(
      (id: any) => typeof id === 'object' && id._id ? id._id : id
    );
    
    // Initialize array to store populated participants
    const populatedParticipants: IParticipant[] = [];
    
    // Try to find participants in both databases
    // First try tradesmen database
    try {
      const tradesmenConn = await connectDB('tradesmen');
      const usersCollection = tradesmenConn.collection('users');
      
      for (const participantId of participantIds) {
        const user = await usersCollection.findOne({ 
          _id: new mongoose.Types.ObjectId(participantId.toString()) 
        });
        
        if (user) {
          populatedParticipants.push({
            _id: user._id,
            name: user.name,
            email: user.email
          });
        }
      }
    } catch (error) {
      console.error('Error fetching users from tradesmen DB:', error);
    }
    
    // Then try customers database for any remaining participants
    try {
      const customersConn = await connectDB('customers');
      const usersCollection = customersConn.collection('users');
      
      // Only look for participants we haven't found yet
      const foundIds = populatedParticipants.map(p => p._id.toString());
      const remainingIds = participantIds.filter(id => !foundIds.includes(id.toString()));
      
      for (const participantId of remainingIds) {
        const user = await usersCollection.findOne({ 
          _id: new mongoose.Types.ObjectId(participantId.toString()) 
        });
        
        if (user) {
          populatedParticipants.push({
            _id: user._id,
            name: user.name,
            email: user.email
          });
        }
      }
    } catch (error) {
      console.error('Error fetching users from customers DB:', error);
    }
    
    // If we're still missing any participants, add placeholders
    const foundIds = populatedParticipants.map(p => p._id.toString());
    for (const participantId of participantIds) {
      if (!foundIds.includes(participantId.toString())) {
        console.warn(`Could not find user with ID ${participantId} in any database - trying tradesmen lookup`);
        
        // Try to find in tradesmen collection directly
        try {
          const tradesmenConn = await connectDB('tradesmen');
          const tradesmenCollection = tradesmenConn.collection('tradesmen');
          
          // Try matching on userId field
          const tradesman = await tradesmenCollection.findOne({
            $or: [
              { userId: participantId.toString() },
              { user: new mongoose.Types.ObjectId(participantId.toString()) }
            ]
          });
          
          if (tradesman) {
            console.log(`Found tradesman in tradesmen collection for ID ${participantId}:`, tradesman.name);
            populatedParticipants.push({
              _id: new mongoose.Types.ObjectId(participantId.toString()),
              name: tradesman.name || "Unknown User",
              email: tradesman.email || ""
            });
            continue;
          }
        } catch (error) {
          console.error('Error looking up in tradesmen collection:', error);
        }
        
        // If still not found, add placeholder
        populatedParticipants.push({
          _id: new mongoose.Types.ObjectId(participantId.toString()),
          name: 'Unknown User',
          email: ''
        });
      }
    }
    
    // Create a new object with populated participants instead of modifying the original
    const populatedConversation: IPopulatedConversation = {
      ...unpopulatedConversation,
      _id: unpopulatedConversation._id as Types.ObjectId,
      participants: populatedParticipants
    };
    
    return NextResponse.json(
      {
        success: true,
        data: populatedConversation,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error getting conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Something went wrong',
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getConversationHandler); 