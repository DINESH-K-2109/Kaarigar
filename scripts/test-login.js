// Script to verify login credentials directly from the database
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Connection URLs
const customersUrl = 'mongodb://localhost:27017/kaarigar_customers';
const tradesmenUrl = 'mongodb://localhost:27017/kaarigar_tradesmen';

// Credentials to test
const credentials = {
  email: 'dinesh@example.com',  // or phone number
  password: 'Guptaji@1'
};

async function testLogin() {
  let customersClient, tradesmenClient;
  
  try {
    // Connect to both databases
    customersClient = new MongoClient(customersUrl);
    tradesmenClient = new MongoClient(tradesmenUrl);
    
    await customersClient.connect();
    console.log('Connected to customers database');
    
    await tradesmenClient.connect();
    console.log('Connected to tradesmen database');
    
    // Check in customers database
    const customersDb = customersClient.db();
    const customersCollection = customersDb.collection('users');
    
    // Check in tradesmen database
    const tradesmenDb = tradesmenClient.db();
    const tradesmenCollection = tradesmenDb.collection('users');
    
    // Try to find user by email in both databases
    const isEmail = credentials.email.includes('@');
    const query = isEmail 
      ? { email: credentials.email }
      : { phone: credentials.email };
    
    console.log('Searching with query:', JSON.stringify(query));
    
    // Check in customers database
    const customerUser = await customersCollection.findOne(query);
    if (customerUser) {
      console.log('User found in customers database:');
      console.log('ID:', customerUser._id);
      console.log('Name:', customerUser.name);
      console.log('Email:', customerUser.email);
      console.log('Role:', customerUser.role);
      console.log('Password hash exists:', !!customerUser.password);
      console.log('Password hash:', customerUser.password);
      
      // Test password
      const isValid = await bcrypt.compare(credentials.password, customerUser.password);
      console.log('Password valid:', isValid);
    } else {
      console.log('User not found in customers database');
    }
    
    // Check in tradesmen database
    const tradesmanUser = await tradesmenCollection.findOne(query);
    if (tradesmanUser) {
      console.log('User found in tradesmen database:');
      console.log('ID:', tradesmanUser._id);
      console.log('Name:', tradesmanUser.name);
      console.log('Email:', tradesmanUser.email);
      console.log('Role:', tradesmanUser.role);
      console.log('Password hash exists:', !!tradesmanUser.password);
      console.log('Password hash:', tradesmanUser.password);
      
      // Test password
      const isValid = await bcrypt.compare(credentials.password, tradesmanUser.password);
      console.log('Password valid:', isValid);
    } else {
      console.log('User not found in tradesmen database');
    }
    
    if (!customerUser && !tradesmanUser) {
      console.log('User not found in either database');
    }
    
  } catch (error) {
    console.error('Error testing login:', error);
  } finally {
    if (customersClient) await customersClient.close();
    if (tradesmenClient) await tradesmenClient.close();
    console.log('Database connections closed');
  }
}

// Run the test
testLogin(); 