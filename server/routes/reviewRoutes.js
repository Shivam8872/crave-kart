
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const Shop = require('../models/Shop');
const mongoose = require('mongoose');

// Get all reviews for a shop
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: 'Invalid shop ID' });
    }
    
    const reviews = await Review.find({ shopId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    // Format the reviews for the client
    const formattedReviews = reviews.map(review => ({
      id: review._id,
      shopId: review.shopId,
      userId: review.userId._id,
      userName: review.userId.name || 'Anonymous User',
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      orderId: review.orderId,
      shopResponse: review.shopResponse
    }));
    
    res.json(formattedReviews);
  } catch (err) {
    console.error('Error fetching shop reviews:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all reviews by a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const reviews = await Review.find({ userId })
      .populate('shopId', 'name logo')
      .sort({ createdAt: -1 });
    
    // Format the reviews for the client
    const formattedReviews = reviews.map(review => ({
      id: review._id,
      shopId: review.shopId._id,
      shopName: review.shopId.name,
      shopLogo: review.shopId.logo,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      orderId: review.orderId,
      shopResponse: review.shopResponse
    }));
    
    res.json(formattedReviews);
  } catch (err) {
    console.error('Error fetching user reviews:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create a new review
router.post('/', async (req, res) => {
  try {
    const { shopId, rating, comment, orderId } = req.body;
    
    // Get user ID from auth token
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: 'Invalid shop ID' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if rating is valid
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Check if user has already reviewed this shop
    const existingReview = await Review.findOne({ shopId, userId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this shop' });
    }
    
    const review = new Review({
      shopId,
      userId,
      rating,
      comment,
      orderId: orderId || undefined
    });
    
    const savedReview = await review.save();
    
    // Populate user details for response
    await savedReview.populate('userId', 'name email');
    
    const formattedReview = {
      id: savedReview._id,
      shopId: savedReview.shopId,
      userId: savedReview.userId._id,
      userName: savedReview.userId.name || 'Anonymous User',
      rating: savedReview.rating,
      comment: savedReview.comment,
      createdAt: savedReview.createdAt,
      orderId: savedReview.orderId
    };
    
    res.status(201).json(formattedReview);
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add shop response to a review
router.post('/:reviewId/response', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID' });
    }
    
    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Find the shop
    const shop = await Shop.findById(review.shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // Check if user is the shop owner
    if (shop.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the shop owner can respond to reviews' });
    }
    
    // Check if response already exists
    if (review.shopResponse) {
      return res.status(400).json({ message: 'A response has already been added to this review' });
    }
    
    // Add the response
    review.shopResponse = {
      response,
      createdAt: new Date()
    };
    
    const updatedReview = await review.save();
    
    res.json({
      id: updatedReview._id,
      shopResponse: updatedReview.shopResponse
    });
  } catch (err) {
    console.error('Error adding review response:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update a review (user can update their own reviews)
router.patch('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID' });
    }
    
    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is the review author
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }
    
    // Update fields if provided
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      review.rating = rating;
    }
    
    if (comment !== undefined) {
      review.comment = comment;
    }
    
    review.updatedAt = Date.now();
    
    const updatedReview = await review.save();
    
    res.json({
      id: updatedReview._id,
      rating: updatedReview.rating,
      comment: updatedReview.comment,
      updatedAt: updatedReview.updatedAt
    });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a review (user can delete their own reviews)
router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID' });
    }
    
    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is the review author
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }
    
    await Review.findByIdAndDelete(reviewId);
    
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
