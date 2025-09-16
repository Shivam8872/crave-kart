import api from './api';
import axios from 'axios';

export interface ScheduledOrder {
  id: string;
  customerId: string;
  shopId: string;
  items: Array<{ foodItem: string; quantity: number }>;
  totalAmount: number;
  address: string;
  scheduledFor: string; // ISO string date
  appliedOfferId?: string;
}

export const createScheduledOrder = async (orderData: Omit<ScheduledOrder, 'id'>) => {
  try {
    console.log('Creating scheduled order with data:', orderData);
    
    // Check if we're dealing with a local shop (non-MongoDB ID)
    const isLocalShop = orderData.shopId && 
      (orderData.shopId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(orderData.shopId));
    
    if (isLocalShop) {
      console.log('Creating scheduled order with local shop ID:', orderData.shopId);
      // For local shops, we'll handle the order locally
      
      // Create a local scheduled order
      const localScheduledOrder = {
        id: `local-scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...orderData,
        createdAt: new Date().toISOString()
      };
      
      // Store in local storage
      const localScheduledOrders = JSON.parse(localStorage.getItem('localScheduledOrders') || '[]');
      localScheduledOrders.push(localScheduledOrder);
      localStorage.setItem('localScheduledOrders', JSON.stringify(localScheduledOrders));
      
      console.log('Local scheduled order created:', localScheduledOrder);
      return localScheduledOrder;
    }
    
    // Continue with normal API order creation for MongoDB shops
    const response = await api.post('/scheduled-orders', orderData, { timeout: 10000 });
    console.log('Scheduled order created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating scheduled order:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timed out. Please try again.');
      }
      
      if (error.response) {
        const errorMessage = error.response.data.message || 'Failed to schedule order';
        throw new Error(errorMessage);
      }
    }
    
    throw new Error('Failed to schedule order');
  }
};

export const getUserScheduledOrders = async (userId: string) => {
  try {
    console.log('Fetching scheduled orders for user:', userId);
    
    // First try to get orders from API
    try {
      const response = await api.get(`/scheduled-orders/user/${userId}`);
      const apiScheduledOrders = response.data;
      console.log(`Received ${apiScheduledOrders.length} API scheduled orders for user ${userId}`);
      
      // Now get any local scheduled orders
      const localScheduledOrders = JSON.parse(localStorage.getItem('localScheduledOrders') || '[]');
      const userLocalScheduledOrders = localScheduledOrders.filter(order => order.customerId === userId);
      
      console.log(`Found ${userLocalScheduledOrders.length} local scheduled orders for user ${userId}`);
      
      // Combine API and local orders
      const allScheduledOrders = [...apiScheduledOrders, ...userLocalScheduledOrders];
      console.log(`Returning ${allScheduledOrders.length} total scheduled orders for user ${userId}`);
      
      return allScheduledOrders;
    } catch (error) {
      console.error('Error fetching scheduled orders from API, falling back to local orders:', error);
      
      // If API fails, fall back to local orders only
      const localScheduledOrders = JSON.parse(localStorage.getItem('localScheduledOrders') || '[]');
      const userLocalScheduledOrders = localScheduledOrders.filter(order => order.customerId === userId);
      
      console.log(`Returning ${userLocalScheduledOrders.length} local scheduled orders for user ${userId}`);
      return userLocalScheduledOrders;
    }
  } catch (error) {
    console.error('Error fetching user scheduled orders:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch scheduled orders');
    }
    throw new Error('Failed to fetch scheduled orders');
  }
};

export const cancelScheduledOrder = async (orderId: string) => {
  try {
    // Check if this is a local scheduled order
    const isLocalOrder = orderId.startsWith('local-scheduled-');
    
    if (isLocalOrder) {
      console.log('Canceling local scheduled order:', orderId);
      // Delete order from local storage
      const localScheduledOrders = JSON.parse(localStorage.getItem('localScheduledOrders') || '[]');
      const updatedLocalScheduledOrders = localScheduledOrders.filter(order => order.id !== orderId);
      localStorage.setItem('localScheduledOrders', JSON.stringify(updatedLocalScheduledOrders));
      return true;
    }
    
    // Otherwise cancel via API
    const response = await api.delete(`/scheduled-orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error canceling scheduled order:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to cancel scheduled order');
    }
    throw new Error('Failed to cancel scheduled order');
  }
};
