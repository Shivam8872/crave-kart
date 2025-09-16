const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// MongoDB Connection
const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery-app'
;

mongoose.connect(dbUrl)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


// Import routes
const userRoutes = require('./routes/userRoutes');
const shopRoutes = require('./routes/shopRoutes');
const foodItemRoutes = require('./routes/foodItemRoutes');
const orderRoutes = require('./routes/orderRoutes');
const offerRoutes = require('./routes/offerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes'); // Add this line

// Set up routes
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/food-items', foodItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes); // Add this line

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
