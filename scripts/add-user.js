// Add a specific user to the kaarigar_customers database
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Connection URL
const url = 'mongodb://localhost:27017/kaarigar_customers';

// User details
const user = {
  name: 'Dinesh',
  email: 'dinesh@example.com',
  password: 'Guptaji@1', // Will be hashed before storing
  role: 'user',
  phone: '9876543210',
  city: 'Mumbai',
  createdAt: new Date(),
  updatedAt: new Date()
};

async function addUser() {
  let client;
  
  try {
    // Connect to the database
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected to the database');
    
    // Get the collection
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Check if user with this email already exists
    const existingUser = await usersCollection.findOne({ email: user.email });
    if (existingUser) {
      console.log('User with this email already exists');
      return;
    }
    
    // Check if user with this phone already exists
    const existingPhone = await usersCollection.findOne({ phone: user.phone });
    if (existingPhone) {
      console.log('User with this phone already exists');
      return;
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    
    // Replace plain password with hashed password
    user.password = hashedPassword;
    
    // Insert the user
    const result = await usersCollection.insertOne(user);
    console.log(`User added with ID: ${result.insertedId}`);
    
  } catch (error) {
    console.error('Error adding user:', error);
  } finally {
    if (client) await client.close();
    console.log('Database connection closed');
  }
}

// Run the function
addUser(); 