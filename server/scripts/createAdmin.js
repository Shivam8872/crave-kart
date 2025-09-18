
/**
 * This script is for creating an admin user directly.
 * It should be run by the site owner or administrator through the server terminal.
 * DO NOT expose this script to the public web interface.
 *
 * To use:
 * 1. Navigate to server directory
 * 2. Run: node scripts/createAdmin.js admin@example.com securePassword "Admin Name"
 *
 * Behavior:
 * - Will create or update the user to role 'admin'
 * - Will also mark the user's email as verified (isEmailVerified=true) so OTP is not required for login
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 3) {
  console.error('Usage: node createAdmin.js <email> <password> <name>');
  process.exit(1);
}

const [email, password, name] = args;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const createAdmin = async () => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      
      // If the user exists but is not an admin, update to admin
      if (existingUser.userType !== 'admin') {
        existingUser.userType = 'admin';
        // Ensure admin created/updated via script is email-verified
        existingUser.isEmailVerified = true;
        await existingUser.save();
        console.log(`User ${email} role updated to admin and marked as email verified.`);
      } else {
        // If already admin, still ensure email is verified
        if (!existingUser.isEmailVerified) {
          existingUser.isEmailVerified = true;
          await existingUser.save();
          console.log(`User ${email} was admin; email marked as verified.`);
        } else {
          console.log(`User ${email} is already an admin and email is verified.`);
        }
      }
    } else {
      // Create new admin user - password will be hashed by pre-save hook
      const admin = new User({
        email,
        password,
        name,
        userType: 'admin',
        // Mark email verified so OTP isn't required for terminal-created admins
        isEmailVerified: true
      });
      
      await admin.save();
      console.log(`Admin user ${email} created successfully and marked as email verified.`);
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();
