import mongoose, { Connection } from 'mongoose';

// Default connection string and database-specific connection strings
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaarigar';
const MONGODB_URI_TRADESMEN = process.env.MONGODB_URI_TRADESMEN || 'mongodb://localhost:27017/kaarigar_tradesmen';
const MONGODB_URI_CUSTOMERS = process.env.MONGODB_URI_CUSTOMERS || 'mongodb://localhost:27017/kaarigar_customers';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Define the connection cache type
type ConnectionCache = {
  conn: Connection | null;
  promise: Promise<Connection> | null;
};

// Define valid database types
type DatabaseType = 'default' | 'tradesmen' | 'customers';

// Create connection cache for multiple databases
const cached: Record<DatabaseType, ConnectionCache> = {
  default: { conn: null, promise: null },
  tradesmen: { conn: null, promise: null },
  customers: { conn: null, promise: null },
};

/**
 * Connect to MongoDB - supports multiple databases
 * @param {DatabaseType} database - Which database to connect to ('default', 'tradesmen', or 'customers')
 */
async function connectDB(database: DatabaseType = 'default'): Promise<Connection> {
  // Select the correct connection string based on the database parameter
  let uri = MONGODB_URI;
  if (database === 'tradesmen') {
    uri = MONGODB_URI_TRADESMEN;
  } else if (database === 'customers') {
    uri = MONGODB_URI_CUSTOMERS;
  }

  // Return existing connection if available
  if (cached[database].conn) {
    return cached[database].conn;
  }

  // Create new connection if none exists
  if (!cached[database].promise) {
    const opts = {
      bufferCommands: false,
    };

    cached[database].promise = mongoose.createConnection(uri, opts).asPromise();
  }
  
  cached[database].conn = await cached[database].promise;
  return cached[database].conn;
}

export default connectDB; 