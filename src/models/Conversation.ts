import mongoose, { Connection, Model } from 'mongoose';
import { IUser } from './User';
import connectDB from '@/lib/db';

export interface IConversation extends mongoose.Document {
  participants: mongoose.Types.ObjectId[] | IUser[];
  lastMessage?: string;
  updatedAt: Date;
  createdAt: Date;
}

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    lastMessage: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Create a compound index for efficient querying of conversations by participants
conversationSchema.index({ participants: 1 });

// Model cache
let conversationModel: Model<IConversation> | null = null;

/**
 * Get Conversation model - using a shared database for conversations
 */
export async function getConversationModel(): Promise<Model<IConversation>> {
  // Return cached model if available
  if (conversationModel) {
    return conversationModel;
  }
  
  // Connect to default database which stores conversations across user types
  const conn = await connectDB('default');
  
  // Create or retrieve model from the connection
  try {
    if (conn.models.Conversation) {
      conversationModel = conn.models.Conversation;
    } else {
      conversationModel = conn.model<IConversation>('Conversation', conversationSchema);
    }
    return conversationModel;
  } catch (error) {
    // If there's an error, try creating the model
    conversationModel = conn.model<IConversation>('Conversation', conversationSchema);
    return conversationModel;
  }
}

// For backward compatibility
export default mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', conversationSchema); 