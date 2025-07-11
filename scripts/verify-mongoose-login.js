// Test authentication using Mongoose directly
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/kaarigar_customers';

// User credentials to test
const credentials = {
  email: 'dinesh@example.com',
  password: 'Guptaji@1'
};

// Define schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { 
    type: String,
    select: false // Important: password will not be returned by default
  },
  role: String,
  phone: String,
  city: String
});

// Password comparison method
userSchema.methods.comparePassword = async function (enteredPassword) {
  console.log('Using comparePassword method with:');
  console.log('- Document password hash:', this.password);
  console.log('- Entered password:', enteredPassword);
  const isMatch = await bcrypt.compare(enteredPassword, this.password);
  console.log('- Result:', isMatch);
  return isMatch;
};

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create model
    const User = mongoose.model('User', userSchema);
    
    console.log('Finding user with email:', credentials.email);
    
    // First try without password selection
    const userWithoutPassword = await User.findOne({ email: credentials.email });
    console.log('User found (without password field):', userWithoutPassword ? 'Yes' : 'No');
    if (userWithoutPassword) {
      console.log('- User ID:', userWithoutPassword._id);
      console.log('- Name:', userWithoutPassword.name);
      console.log('- Has password field:', !!userWithoutPassword.password);
    }
    
    // Try with password field
    const userWithPassword = await User.findOne({ email: credentials.email }).select('+password');
    console.log('User found (with password field):', userWithPassword ? 'Yes' : 'No');
    
    if (userWithPassword) {
      console.log('- User ID:', userWithPassword._id);
      console.log('- Name:', userWithPassword.name);
      console.log('- Has password field:', !!userWithPassword.password);
      
      // Try authenticate
      if (userWithPassword.password) {
        console.log('\nTesting bcrypt compare directly:');
        const isValidPassword = await bcrypt.compare(credentials.password, userWithPassword.password);
        console.log('- Password valid (direct bcrypt):', isValidPassword);
        
        console.log('\nTesting model method:');
        if (typeof userWithPassword.comparePassword === 'function') {
          const isValid = await userWithPassword.comparePassword(credentials.password);
          console.log('- Password valid (model method):', isValid);
        } else {
          console.log('- comparePassword method not available');
        }
      } else {
        console.log('- No password to verify');
      }
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run test
testLogin();
