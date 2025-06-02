import mongoose, { Connection, Model } from 'mongoose';
import { IUser } from './User';
import connectDB from '@/lib/db';

export interface IMessage extends mongoose.Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId | IUser;
  receiver: mongoose.Types.ObjectId | IUser;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Model cache
let messageModel: Model<IMessage> | null = null;

/**
 * Get Message model - using a shared database for messages
 */
export async function getMessageModel(): Promise<Model<IMessage>> {
  // Return cached model if available
  if (messageModel) {
    return messageModel;
  }
  
  // Connect to default database which stores messages across user types
  const conn = await connectDB('default');
  
  // Create or retrieve model from the connection
  try {
    if (conn.models.Message) {
      messageModel = conn.models.Message;
    } else {
      messageModel = conn.model<IMessage>('Message', messageSchema);
    }
    return messageModel;
  } catch (error) {
    // If there's an error, try creating the model
    messageModel = conn.model<IMessage>('Message', messageSchema);
    return messageModel;
  }
}

// For backward compatibility
export default mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema); 