
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Shop = require('../models/Shop');
const FoodItem = require('../models/FoodItem');
const mongoose = require('mongoose');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email')
      .populate('shop', 'name')
      .populate({
        path: 'items.foodItem',
        select: 'name price image'
      });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get customer orders
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.params.userId })
      .populate('shop', 'name logo')
      .populate({
        path: 'items.foodItem',
        select: 'name price image'
      })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get shop orders
router.get('/shop/:shopId', async (req, res) => {
  try {
    const orders = await Order.find({ shop: req.params.shopId })
      .populate('customer', 'name email')
      .populate({
        path: 'items.foodItem',
        select: 'name price image'
      })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('shop', 'name logo')
      .populate({
        path: 'items.foodItem',
        select: 'name price image'
      });
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create order
router.post('/', async (req, res) => {
  const { customerId, shopId, items, totalAmount, address, structuredAddress, appliedOfferId, paymentMethod } = req.body;
  
  try {
    console.log('Creating order with:', { customerId, shopId });
    
    // Check if IDs are valid ObjectIds
    const isValidCustomerId = mongoose.Types.ObjectId.isValid(customerId);
    const isValidShopId = mongoose.Types.ObjectId.isValid(shopId);
    
    if (!isValidCustomerId) {
      return res.status(400).json({ message: `Invalid customer ID format: ${customerId}` });
    }
    
    if (!isValidShopId) {
      return res.status(400).json({ message: `Invalid shop ID format: ${shopId}` });
    }
    
    // Check if customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      console.error(`Customer not found with ID: ${customerId}`);
      return res.status(400).json({ message: 'Customer not found' });
    }
    
    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(400).json({ message: 'Shop not found' });
    }
    
    // Check if shop is approved
    if (shop.status !== 'approved') {
      return res.status(400).json({ message: 'Shop is not approved for orders' });
    }
    
    // Validate order items
    const orderItems = [];
    for (const item of items) {
      // Check if food item ID is valid
      const isValidFoodItemId = mongoose.Types.ObjectId.isValid(item.foodItem);
      if (!isValidFoodItemId) {
        return res.status(400).json({ message: `Invalid food item ID format: ${item.foodItem}` });
      }
      
      const foodItem = await FoodItem.findById(item.foodItem);
      if (!foodItem) {
        return res.status(400).json({ message: `Food item not found: ${item.foodItem}` });
      }
      
      if (foodItem.shopId.toString() !== shopId) {
        return res.status(400).json({ message: `Food item ${foodItem.name} does not belong to this shop` });
      }
      
      orderItems.push({
        foodItem: item.foodItem,
        quantity: item.quantity,
        price: foodItem.price * item.quantity
      });
    }
    
    const order = new Order({
      customer: customerId,
      shop: shopId,
      items: orderItems,
      totalAmount,
      address,
      structuredAddress: structuredAddress || undefined,  // Only add if provided
      appliedOffer: appliedOfferId || null,
      paymentMethod: paymentMethod || 'card',
      status: 'pending'
    });
    
    const newOrder = await order.save();
    
    // Populate order details for response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('customer', 'name email')
      .populate('shop', 'name logo')
      .populate({
        path: 'items.foodItem',
        select: 'name price image'
      });
    
    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  
  try {
    // Validate status is one of the allowed values
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check for valid status transitions
    // For example, can't go from pending to delivered directly
    
    order.status = status;
    order.updatedAt = Date.now(); // Update the timestamp
    
    const updatedOrder = await order.save();
    
    // Return the populated order with customer and shop details
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('customer', 'name email')
      .populate('shop', 'name logo')
      .populate({
        path: 'items.foodItem',
        select: 'name price image'
      });
    
    res.json(populatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
