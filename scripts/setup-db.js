// This script sets up initial data in the MongoDB databases
// Run with: node scripts/setup-db.js

const { MongoClient } = require('mongodb');

// Connection URLs
const tradesmenDbUrl = 'mongodb://localhost:27017/kaarigar_tradesmen';
const customersDbUrl = 'mongodb://localhost:27017/kaarigar_customers';

// Sample data
const tradesmenUsers = [
  {
    name: 'John Tradesman',
    email: 'john@example.com',
    password: '$2a$10$1JqT.xi6HxkR.Qh0CBmN5OGdSR4PKd6pQQ/V6jQ6HUT/YWjW.W1zS', // hashed 'password123'
    role: 'tradesman',
    phone: '9876543210',
    city: 'Mumbai',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Raj Builder',
    email: 'raj@example.com',
    password: '$2a$10$1JqT.xi6HxkR.Qh0CBmN5OGdSR4PKd6pQQ/V6jQ6HUT/YWjW.W1zS', // hashed 'password123'
    role: 'tradesman',
    phone: '8765432109',
    city: 'Delhi',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const tradesmenProfiles = [
  {
    user: null, // Will be populated after user insertion
    skills: ['Plumbing', 'Electrical', 'Carpentry'],
    experience: 8,
    hourlyRate: 500,
    city: 'Mumbai',
    bio: 'Experienced plumber and electrician with 8 years of work in residential and commercial projects.',
    availability: 'Weekdays 9am-6pm',
    rating: 4.7,
    totalReviews: 24,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    user: null, // Will be populated after user insertion
    skills: ['Masonry', 'Painting', 'Tiling'],
    experience: 12,
    hourlyRate: 600,
    city: 'Delhi',
    bio: 'Professional builder with expertise in masonry, painting and tiling. 12 years of experience in the construction industry.',
    availability: 'Everyday 8am-8pm',
    rating: 4.9,
    totalReviews: 36,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const customerUsers = [
  {
    name: 'Sarah Customer',
    email: 'sarah@example.com',
    password: '$2a$10$1JqT.xi6HxkR.Qh0CBmN5OGdSR4PKd6pQQ/V6jQ6HUT/YWjW.W1zS', // hashed 'password123'
    role: 'user',
    phone: '7654321098',
    city: 'Bangalore',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Amit User',
    email: 'amit@example.com',
    password: '$2a$10$1JqT.xi6HxkR.Qh0CBmN5OGdSR4PKd6pQQ/V6jQ6HUT/YWjW.W1zS', // hashed 'password123'
    role: 'user',
    phone: '6543210987',
    city: 'Chennai',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function setupDatabases() {
  let tradesmenClient, customersClient;

  try {
    // Connect to tradesmen database
    tradesmenClient = new MongoClient(tradesmenDbUrl);
    await tradesmenClient.connect();
    console.log('Connected to tradesmen database');

    // Connect to customers database
    customersClient = new MongoClient(customersDbUrl);
    await customersClient.connect();
    console.log('Connected to customers database');

    // Insert tradesmen users
    const tradesmenDb = tradesmenClient.db();
    const tradesmenUsersCollection = tradesmenDb.collection('users');
    const tradesmenResult = await tradesmenUsersCollection.insertMany(tradesmenUsers);
    console.log(`${tradesmenResult.insertedCount} tradesmen users inserted`);

    // Insert tradesmen profiles with user references
    const tradesmenCollection = tradesmenDb.collection('tradesmen');
    
    // Update tradesmen profiles with user references
    for (let i = 0; i < tradesmenProfiles.length; i++) {
      tradesmenProfiles[i].user = tradesmenResult.insertedIds[i];
    }
    
    const tradesmenProfilesResult = await tradesmenCollection.insertMany(tradesmenProfiles);
    console.log(`${tradesmenProfilesResult.insertedCount} tradesmen profiles inserted`);

    // Insert customer users
    const customersDb = customersClient.db();
    const customersCollection = customersDb.collection('users');
    const customersResult = await customersCollection.insertMany(customerUsers);
    console.log(`${customersResult.insertedCount} customer users inserted`);

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up databases:', error);
  } finally {
    // Close connections
    if (tradesmenClient) await tradesmenClient.close();
    if (customersClient) await customersClient.close();
  }
}

// Run the setup
setupDatabases(); 