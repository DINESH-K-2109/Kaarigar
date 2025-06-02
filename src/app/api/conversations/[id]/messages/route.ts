import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getConversationModel } from '@/models/Conversation';
import { getMessageModel } from '@/models/Message';
import { getUserModel, IUser } from '@/models/User';
import { withAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// Define interface for user data we use in messages
interface IMessageParticipant {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
}

// Define interface for populated message
interface IPopulatedMessage {
  _id: mongoose.Types.ObjectId;
  conversation: mongoose.Types.ObjectId;
  sender: IMessageParticipant;
  receiver: IMessageParticipant;
  content: string;
  isRead: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  [key: string]: any; // For any additional fields
}

async function getMessagesHandler(req: NextRequest, authUser: any) {
  try {
    // Extract conversation ID from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const conversationId = pathSegments[pathSegments.length - 2]; // Get the ID from the URL path
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Getting messages for conversation: ${conversationId}`);
    
    // Connect to the default database
    await connectDB('default');
    
    // Ensure User models are registered in both databases before using populate
    try {
      await getUserModel('customers');
      await getUserModel('tradesman');
    } catch (error) {
      console.warn('Error pre-registering User models:', error);
    }
    
    // Get models
    const Conversation = await getConversationModel();
    const Message = await getMessageModel();
    
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
    
    // Get messages for this conversation
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: 1 });
    
    return NextResponse.json(
      {
        success: true,
        count: messages.length,
        data: messages,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error getting messages:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

async function sendMessageHandler(req: NextRequest, authUser: any) {
  try {
    // Extract conversation ID from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const conversationId = pathSegments[pathSegments.length - 2]; // Get the ID from the URL path
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Sending message to conversation: ${conversationId}`);
    
    // Connect to the default database
    await connectDB('default');
    
    // Ensure User models are registered in both databases before using populate
    try {
      await getUserModel('customers');
      await getUserModel('tradesman');
    } catch (error) {
      console.warn('Error pre-registering User models:', error);
    }
    
    // Get models
    const Conversation = await getConversationModel();
    const Message = await getMessageModel();
    
    // Get request body
    const body = await req.json();
    const { content } = body;
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Message content is required' },
        { status: 400 }
      );
    }
    
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
    
    // Determine receiver (other participant)
    const receiverId = conversation.participants.find(
      (id) => id.toString() !== authUser.id
    );
    
    if (!receiverId) {
      return NextResponse.json(
        { success: false, message: 'Receiver not found in conversation' },
        { status: 400 }
      );
    }
    
    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: authUser.id,
      receiver: receiverId,
      content,
    });
    
    // Populate sender and receiver
    // Instead of directly populating, do it manually to avoid mongoose connection issues
    const messageObj = message.toObject();
    let populatedMessage: IPopulatedMessage = {
      ...messageObj,
      _id: messageObj._id as mongoose.Types.ObjectId,
      conversation: messageObj.conversation as mongoose.Types.ObjectId,
      sender: {
        _id: new mongoose.Types.ObjectId(authUser.id),
        name: '',
        email: ''
      },
      receiver: {
        _id: new mongoose.Types.ObjectId(receiverId.toString()),
        name: '',
        email: ''
      }
    };
    
    try {
      // Try to find sender in tradesman DB
      const tradesmenConn = await connectDB('tradesmen');
      const tradesmenUsers = tradesmenConn.collection('users');
      const sender = await tradesmenUsers.findOne({ 
        _id: new mongoose.Types.ObjectId(authUser.id) 
      });
      
      if (sender) {
        populatedMessage.sender = {
          _id: sender._id,
          name: sender.name,
          email: sender.email
        };
      }
      
      // Try to find receiver in tradesman DB
      const receiver = await tradesmenUsers.findOne({ 
        _id: new mongoose.Types.ObjectId(receiverId.toString()) 
      });
      
      if (receiver) {
        populatedMessage.receiver = {
          _id: receiver._id,
          name: receiver.name,
          email: receiver.email
        };
      }
    } catch (error) {
      console.error('Error finding users in tradesmen DB:', error);
    }
    
    // If we didn't find the users in tradesmen, try customers DB
    if (!populatedMessage.sender?.name || !populatedMessage.receiver?.name) {
      try {
        const customersConn = await connectDB('customers');
        const customersUsers = customersConn.collection('users');
        
        if (!populatedMessage.sender?.name) {
          const sender = await customersUsers.findOne({ 
            _id: new mongoose.Types.ObjectId(authUser.id) 
          });
          
          if (sender) {
            populatedMessage.sender = {
              _id: sender._id,
              name: sender.name,
              email: sender.email
            };
          }
        }
        
        if (!populatedMessage.receiver?.name) {
          const receiver = await customersUsers.findOne({ 
            _id: new mongoose.Types.ObjectId(receiverId.toString()) 
          });
          
          if (receiver) {
            populatedMessage.receiver = {
              _id: receiver._id,
              name: receiver.name,
              email: receiver.email
            };
          }
        }
      } catch (error) {
        console.error('Error finding users in customers DB:', error);
      }
    }
    
    // If still missing names, try looking in the tradesmen collection directly (not user collection)
    if (!populatedMessage.sender?.name || !populatedMessage.receiver?.name) {
      try {
        const tradesmenConn = await connectDB('tradesmen');
        const tradesmenCollection = tradesmenConn.collection('tradesmen');
        
        if (!populatedMessage.sender?.name) {
          // Try matching on userId field
          const senderTradesman = await tradesmenCollection.findOne({
            $or: [
              { userId: authUser.id },
              { user: new mongoose.Types.ObjectId(authUser.id) }
            ]
          });
          
          if (senderTradesman) {
            console.log('Found sender in tradesmen collection:', senderTradesman.name);
            populatedMessage.sender = {
              _id: new mongoose.Types.ObjectId(authUser.id),
              name: senderTradesman.name,
              email: senderTradesman.email || ""
            };
          }
        }
        
        if (!populatedMessage.receiver?.name) {
          // Try matching on userId field
          const receiverTradesman = await tradesmenCollection.findOne({
            $or: [
              { userId: receiverId.toString() },
              { user: new mongoose.Types.ObjectId(receiverId.toString()) }
            ]
          });
          
          if (receiverTradesman) {
            console.log('Found receiver in tradesmen collection:', receiverTradesman.name);
            populatedMessage.receiver = {
              _id: new mongoose.Types.ObjectId(receiverId.toString()),
              name: receiverTradesman.name,
              email: receiverTradesman.email || ""
            };
          }
        }
      } catch (error) {
        console.error('Error finding tradesmen in tradesmen collection:', error);
      }
    }
    
    // Update conversation with last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content,
      updatedAt: new Date(),
    });
    
    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
        data: populatedMessage,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong', stack: error.stack },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getMessagesHandler);
export const POST = withAuth(sendMessageHandler); 