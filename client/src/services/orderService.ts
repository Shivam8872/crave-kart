
import api from './api';
import axios from 'axios';
import { Order } from '@/types/order';

export interface StructuredAddress {
  name: string;
  phone: string;
  houseNumber: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  label: 'home' | 'work' | 'other';
}

export const createOrder = async (orderData: {
  customerId: string;
  shopId: string;
  items: Array<{ foodItem: string; quantity: number }>;
  totalAmount: number;
  address: string;
  structuredAddress?: StructuredAddress | null;
  appliedOfferId?: string;
  paymentMethod?: 'card' | 'upi' | 'cod' | 'wallet';
}) => {
  try {
    // Log the order data before sending
    console.log('Creating order with data:', orderData);
    
    // Check if we're dealing with a local shop (non-MongoDB ID)
    const isLocalShop = orderData.shopId && 
      (orderData.shopId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(orderData.shopId));
    
    if (isLocalShop) {
      console.log('Creating order with local shop ID:', orderData.shopId);
      // For local shops, we'll handle the order locally
      // Since the server won't accept non-MongoDB ObjectIds
      
      // Create a local order
      const localOrder = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customer: orderData.customerId,
        shop: orderData.shopId,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        address: orderData.address,
        structuredAddress: orderData.structuredAddress || null,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        appliedOffer: orderData.appliedOfferId || null,
        paymentMethod: orderData.paymentMethod || 'card',
        paymentStatus: 'pending' as const
      };
      
      // Store in local storage
      const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
      localOrders.push(localOrder);
      localStorage.setItem('localOrders', JSON.stringify(localOrders));
      
      console.log('Local order created:', localOrder);
      return localOrder;
    }
    
    // Continue with normal API order creation for MongoDB shops
    // Ensure we're sending the correct ID format
    // MongoDB can handle both string ID and ObjectId
    const processedOrderData = {
      ...orderData,
      // Ensure IDs are string format for consistency
      customerId: orderData.customerId?.toString(),
      shopId: orderData.shopId?.toString(),
      items: orderData.items.map(item => ({
        ...item,
        foodItem: item.foodItem?.toString()
      })),
      structuredAddress: orderData.structuredAddress || null,
      paymentMethod: orderData.paymentMethod || 'card'
    };
    
    // Add timeout to prevent hanging requests
    const response = await api.post('/api/orders', processedOrderData, { timeout: 10000 });
    console.log('Order created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    
    // More detailed error handling
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timed out. Please try again.');
      }
      
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error. Please check your connection to the server.');
      }
      
      if (error.response) {
        // Get the specific error message from the server response
        const errorMessage = error.response.data.message || 'Failed to create order';
        console.error('Server error response:', error.response.data);
        throw new Error(errorMessage);
      }
    }
    
    throw new Error('Failed to create order');
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    console.log('Fetching orders for user:', userId);
    
    // First try to get orders from API
    try {
      const response = await api.get(`/api/orders/user/${userId}`);
      
      // Ensure we only return orders that belong to this user
      const apiOrders = response.data;
      console.log(`Received ${apiOrders.length} API orders for user ${userId}`);
      
      // Additional validation to ensure orders belong to the user
      const validApiOrders = apiOrders.filter(order => {
        const orderCustomerId = typeof order.customer === 'string' 
          ? order.customer 
          : (order.customer._id || order.customer.id);
        
        const isUserOrder = orderCustomerId === userId;
        if (!isUserOrder) {
          console.warn(`Filtering out order ${order._id || order.id} that doesn't belong to user ${userId}`);
        }
        return isUserOrder;
      });
      
      // Now get any local orders
      const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
      const userLocalOrders = localOrders.filter(order => order.customer === userId);
      
      console.log(`Found ${userLocalOrders.length} local orders for user ${userId}`);
      
      // Combine API and local orders
      const allOrders = [...validApiOrders, ...userLocalOrders];
      console.log(`Returning ${allOrders.length} total orders for user ${userId}`);
      
      return allOrders;
    } catch (error) {
      console.error('Error fetching orders from API, falling back to local orders:', error);
      
      // If API fails, fall back to local orders only
      const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
      const userLocalOrders = localOrders.filter(order => order.customer === userId);
      
      console.log(`Returning ${userLocalOrders.length} local orders for user ${userId}`);
      return userLocalOrders;
    }
  } catch (error) {
    console.error('Error fetching user orders:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch orders');
    }
    throw new Error('Failed to fetch orders');
  }
};

export const getShopOrders = async (shopId: string): Promise<Order[]> => {
  try {
    // Check if we're dealing with a local shop ID
    const isLocalShop = shopId && (shopId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(shopId));
    
    if (isLocalShop) {
      console.log('Getting orders for local shop:', shopId);
      // Get orders from local storage
      const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
      const shopOrders = localOrders.filter(order => order.shop === shopId);
      return shopOrders;
    }
    
    // Otherwise get from API
    const response = await api.get(`/api/orders/shop/${shopId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch orders');
    }
    throw new Error('Failed to fetch orders');
  }
};

export const updateOrderStatus = async (
  orderId: string, 
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
) => {
  try {
    // Check if this is a local order
    const isLocalOrder = orderId.startsWith('local-');
    
    if (isLocalOrder) {
      console.log('Updating status for local order:', orderId);
      // Update order in local storage
      const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
      const orderIndex = localOrders.findIndex((order: any) => order.id === orderId);
      
      if (orderIndex !== -1) {
        localOrders[orderIndex].status = status;
        localStorage.setItem('localOrders', JSON.stringify(localOrders));
        return localOrders[orderIndex];
      } else {
        throw new Error('Local order not found');
      }
    }
    
    // Otherwise update via API
    const response = await api.patch(`/api/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to update order');
    }
    throw new Error('Failed to update order');
  }
};

// New function to get a single order by ID
export const getOrderById = async (orderId: string): Promise<Order> => {
  try {
    // Check if this is a local order
    const isLocalOrder = orderId.startsWith('local-');
    
    if (isLocalOrder) {
      console.log('Fetching local order:', orderId);
      const localOrders = JSON.parse(localStorage.getItem('localOrders') || '[]');
      const order = localOrders.find((order: any) => order.id === orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return order;
    }
    
    // Otherwise get from API
    const response = await api.get(`/api/orders/${orderId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch order');
    }
    throw new Error('Failed to fetch order');
  }
};
