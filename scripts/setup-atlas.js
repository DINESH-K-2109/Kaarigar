const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Connection URLs from environment variables
const tradesmenDbUrl = process.env.MONGODB_URI_TRADESMEN;
const customersDbUrl = process.env.MONGODB_URI_CUSTOMERS;

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
    name: 'Test Customer',
    email: 'customer@example.com',
    password: '$2a$10$1JqT.xi6HxkR.Qh0CBmN5OGdSR4PKd6pQQ/V6jQ6HUT/YWjW.W1zS', // hashed 'password123'
    role: 'customer',
    phone: '9876543211',
    city: 'Mumbai',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function setupAtlasDatabases() {
  let tradesmenClient, customersClient;
  
  try {
    // Connect to both databases
    tradesmenClient = new MongoClient(tradesmenDbUrl);
    customersClient = new MongoClient(customersDbUrl);
    
    await tradesmenClient.connect();
    console.log('Connected to tradesmen database');
    
    await customersClient.connect();
    console.log('Connected to customers database');
    
    // Set up tradesmen database
    const tradesmenDb = tradesmenClient.db();
    const usersCollection = tradesmenDb.collection('users');
    const profilesCollection = tradesmenDb.collection('profiles');
    
    // Insert tradesmen users
    const usersResult = await usersCollection.insertMany(tradesmenUsers);
    console.log(`${usersResult.insertedCount} tradesmen users inserted`);
    
    // Update profiles with user references
    const profiles = tradesmenProfiles.map((profile, index) => ({
      ...profile,
      user: usersResult.insertedIds[index]
    }));
    
    // Insert tradesmen profiles
    const profilesResult = await profilesCollection.insertMany(profiles);
    console.log(`${profilesResult.insertedCount} tradesmen profiles inserted`);
    
    // Set up customers database
    const customersDb = customersClient.db();
    const customersCollection = customersDb.collection('users');
    
    // Insert customer users
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

setupAtlasDatabases(); 