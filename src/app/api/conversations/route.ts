import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getConversationModel } from '@/models/Conversation';
import { getUserModel } from '@/models/User';
import { withAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// Define the debug info interface
interface DebugInfo {
  receiverId: string;
  objectIdStr: string;
  formats: string[];
  databases: {
    tradesmen?: {
      checked: boolean;
      results: Array<{ format: string; found: boolean }>;
      error?: string;
    };
    customers?: {
      checked: boolean;
      results: Array<{ format: string; found: boolean }>;
      error?: string;
    };
  };
}

async function getConversations(req: NextRequest, authUser: any) {
  try {
    // Connect to the default database
    await connectDB('default');
    
    // Pre-register User models in both databases to avoid schema registration issues
    try {
      await getUserModel('customers');
      await getUserModel('tradesman');
    } catch (error) {
      console.warn('Error pre-registering User models:', error);
    }
    
    // Get the Conversation model
    const Conversation = await getConversationModel();
    
    const conversations = await Conversation.find({
      participants: authUser.id,
    })
      .populate('participants', 'name email')
      .sort({ updatedAt: -1 });
    
    return NextResponse.json(
      {
        success: true,
        count: conversations.length,
        data: conversations,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error getting conversations:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

async function createConversation(req: NextRequest, authUser: any) {
  try {
    // Connect to the default database
    await connectDB('default');
    
    // Get the Conversation model
    const Conversation = await getConversationModel();
    
    const body = await req.json();
    const { receiverId } = body;
    
    if (!receiverId) {
      return NextResponse.json(
        { success: false, message: 'Receiver ID is required' },
        { status: 400 }
      );
    }
    
    // Prevent messaging yourself
    if (authUser.id === receiverId) {
      return NextResponse.json(
        { success: false, message: 'You cannot start a conversation with yourself' },
        { status: 400 }
      );
    }
    
    // Log for debugging
    console.log(`Creating conversation between ${authUser.id} and ${receiverId}`);
    console.log(`Receiver ID type: ${typeof receiverId}`);
    
    // Try different formats of the ID
    let receiverObjectId;
    try {
      receiverObjectId = new mongoose.Types.ObjectId(receiverId);
      console.log('Successfully created ObjectId:', receiverObjectId.toString());
    } catch (error: any) {
      console.error('Invalid receiver ID format:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid receiver ID format',
          debug: { 
            id: receiverId,
            error: error.message
          }
        },
        { status: 400 }
      );
    }
    
    // Check if receiver exists - try both databases with ALL possible ID formats
    let receiverExists = false;
    let receiverUser = null;
    const debugInfo: DebugInfo = {
      receiverId,
      objectIdStr: receiverObjectId.toString(),
      formats: [],
      databases: {}
    };
    
    // === TRADESMEN DATABASE ===
    try {
      const tradesmenConn = await connectDB('tradesmen');
      const usersCollection = tradesmenConn.collection('users');
      
      // We'll try different formats and log the attempts
      const formats = [
        { format: 'original', value: receiverId },
        { format: 'objectId', value: receiverObjectId },
        { format: 'toString', value: receiverObjectId.toString() },
        { format: 'toLower', value: receiverId.toLowerCase() },
        { format: 'toUpper', value: receiverId.toUpperCase() },
      ];
      
      debugInfo.formats = formats.map(f => f.format);
      debugInfo.databases.tradesmen = { checked: true, results: [] };
      
      // Show all users for debugging
      const allUsers = await usersCollection.find({}, { projection: { _id: 1, name: 1, email: 1 }}).limit(10).toArray();
      console.log('Sample users in tradesmen database:', allUsers.map(u => ({ id: u._id.toString(), name: u.name })));
      
      // Try each format
      for (const format of formats) {
        try {
          const query = { _id: format.value };
          console.log(`Searching in tradesmen with ${format.format}:`, format.value);
          const result = await usersCollection.findOne(query);
          
          if (debugInfo.databases.tradesmen) {
            debugInfo.databases.tradesmen.results.push({
              format: format.format,
              found: !!result
            });
          }
          
          if (result) {
            console.log(`Receiver found in tradesmen database using ${format.format} format`);
            receiverUser = result;
            receiverExists = true;
            break;
          }
        } catch (err) {
          console.error(`Error with ${format.format} format:`, err);
        }
      }
      
      // Try a broader search as last resort
      if (!receiverExists) {
        try {
          // Try to find any user that might match by string pattern
          const allIds = await usersCollection.find({}, { projection: { _id: 1 }}).toArray();
          const matchingIds = allIds.filter(item => {
            const id = item._id.toString();
            return id.includes(receiverId) || receiverId.includes(id);
          });
          
          if (matchingIds.length > 0) {
            console.log('Found similar IDs in tradesmen:', matchingIds.map(i => i._id.toString()));
            const firstMatch = await usersCollection.findOne({ _id: matchingIds[0]._id });
            if (firstMatch) {
              console.log('Using closest matching ID:', matchingIds[0]._id.toString());
              receiverUser = firstMatch;
              receiverExists = true;
            }
          }
        } catch (err) {
          console.error('Error in pattern search:', err);
        }
      }
    } catch (error: any) {
      console.error('Error checking tradesmen database:', error);
      if (debugInfo.databases.tradesmen) {
        debugInfo.databases.tradesmen.error = error.message;
      }
    }
    
    // === CUSTOMERS DATABASE ===
    if (!receiverExists) {
      try {
        const customersConn = await connectDB('customers');
        const usersCollection = customersConn.collection('users');
        
        debugInfo.databases.customers = { checked: true, results: [] };
        
        // Show all users for debugging
        const allUsers = await usersCollection.find({}, { projection: { _id: 1, name: 1, email: 1 }}).limit(10).toArray();
        console.log('Sample users in customers database:', allUsers.map(u => ({ id: u._id.toString(), name: u.name })));
        
        // Try each format again
        const formats = [
          { format: 'original', value: receiverId },
          { format: 'objectId', value: receiverObjectId },
          { format: 'toString', value: receiverObjectId.toString() },
          { format: 'toLower', value: receiverId.toLowerCase() },
          { format: 'toUpper', value: receiverId.toUpperCase() },
        ];
        
        for (const format of formats) {
          try {
            const query = { _id: format.value };
            console.log(`Searching in customers with ${format.format}:`, format.value);
            const result = await usersCollection.findOne(query);
            
            if (debugInfo.databases.customers) {
              debugInfo.databases.customers.results.push({
                format: format.format,
                found: !!result
              });
            }
            
            if (result) {
              console.log(`Receiver found in customers database using ${format.format} format`);
              receiverUser = result;
              receiverExists = true;
              break;
            }
          } catch (err) {
            console.error(`Error with ${format.format} format:`, err);
          }
        }
        
        // Try a broader search as last resort
        if (!receiverExists) {
          try {
            // Try to find any user that might match by string pattern
            const allIds = await usersCollection.find({}, { projection: { _id: 1 }}).toArray();
            const matchingIds = allIds.filter(item => {
              const id = item._id.toString();
              return id.includes(receiverId) || receiverId.includes(id);
            });
            
            if (matchingIds.length > 0) {
              console.log('Found similar IDs in customers:', matchingIds.map(i => i._id.toString()));
              const firstMatch = await usersCollection.findOne({ _id: matchingIds[0]._id });
              if (firstMatch) {
                console.log('Using closest matching ID:', matchingIds[0]._id.toString());
                receiverUser = firstMatch;
                receiverExists = true;
              }
            }
          } catch (err) {
            console.error('Error in pattern search:', err);
          }
        }
      } catch (error: any) {
        console.error('Error checking customers database:', error);
        if (debugInfo.databases.customers) {
          debugInfo.databases.customers.error = error.message;
        }
      }
    }
    
    // FALLBACK: If still not found, create a mock conversation for testing
    if (!receiverExists && process.env.NODE_ENV !== 'production') {
      console.log('USER NOT FOUND - Creating test conversation in development mode');
      
      // Only do this in development, never in production
      const conversation = await Conversation.create({
        participants: [authUser.id, receiverId],
      });
      
      return NextResponse.json(
        {
          success: true,
          message: 'Test conversation created (development mode)',
          data: conversation,
        },
        { status: 201 }
      );
    }
    
    // Check if receiver exists
    if (!receiverExists) {
      return NextResponse.json(
        {
          success: false,
          message: 'Receiver not found',
          debug: debugInfo,
        },
        { status: 404 }
      );
    }
    
    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: {
        $all: [authUser.id, receiverId],
      },
    });
    
    if (existingConversation) {
      return NextResponse.json(
        {
          success: true,
          message: 'Conversation already exists',
          data: existingConversation,
        },
        { status: 200 }
      );
    }
    
    // Create new conversation
    if (receiverUser && receiverExists) {
      const conversation = await Conversation.create({
        participants: [authUser.id, receiverId],
      });
      
      return NextResponse.json(
        {
          success: true,
          message: 'Conversation created successfully',
          data: conversation,
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create conversation - receiver not found',
          debug: debugInfo,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Something went wrong',
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getConversations);
export const POST = withAuth(createConversation); 