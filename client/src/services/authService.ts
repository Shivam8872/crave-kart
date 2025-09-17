
import api from './api';
import axios from 'axios';

export interface Credentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  userType: "customer" | "shopOwner" | "admin";
}

export interface User {
  id: string; // We'll ensure this is set from _id
  _id?: string;
  email: string;
  name: string;
  userType: "customer" | "shopOwner" | "admin";
  ownedShopId?: string;
  token?: string;
  createdAt?: Date;
}

// Demo users for offline development/testing
const DEMO_USERS: User[] = [
  {
    id: 'demo-customer-1',
    email: 'customer@example.com',
    name: 'Demo Customer',
    userType: 'customer' as const,
    token: 'demo-customer-token',
    createdAt: new Date()
  },
  {
    id: 'demo-shopowner-1',
    email: 'owner@example.com',
    name: 'Demo Shop Owner',
    userType: 'shopOwner' as const,
    ownedShopId: 'demo-shop-1',
    token: 'demo-shopowner-token',
    createdAt: new Date()
  },
  {
    id: 'demo-admin-1',
    email: 'admin@example.com',
    name: 'Demo Admin',
    userType: 'admin' as const,
    token: 'demo-admin-token',
    createdAt: new Date()
  }
];

// Simulate a server response for demo login
const simulateDemoLogin = (email: string, password: string): User | null => {
  // In a real app, we'd check the password with a hash
  // For demo purposes, accept any password for demo users
  const demoUser = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (demoUser && password.length >= 6) {
    // Return a new object to ensure it matches the User type
    return {
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      userType: demoUser.userType,
      token: demoUser.token,
      createdAt: demoUser.createdAt,
      ...(demoUser.ownedShopId && { ownedShopId: demoUser.ownedShopId })
    };
  }
  return null;
};

// Simulate a server response for demo registration
const simulateDemoRegistration = (userData: RegistrationData): User => {
  const { userType } = userData;
  
  // userType is already validated by RegistrationData type
  const newUser: User = {
    id: `demo-${userType}-${Date.now()}`,
    email: userData.email,
    name: userData.name,
    userType, // RegistrationData already ensures this is "customer" | "shopOwner" | "admin"
    token: `demo-${userType}-token-${Date.now()}`,
    createdAt: new Date()
  };
  
  return newUser;
};

export const register = async (userData: RegistrationData) => {
  try {
    const response = await api.post('/users', userData);
    
    // Add the token to the response data and ensure we have an id property
    const userType = response.data.userType;
    if (userType !== 'customer' && userType !== 'shopOwner' && userType !== 'admin') {
      throw new Error('Invalid user type received from server');
    }
    
    const user: User = {
      id: response.data._id, // Use MongoDB's _id as our id
      email: response.data.email,
      name: response.data.name,
      userType: userType,
      token: response.data.token,
      createdAt: response.data.createdAt,
      ...(response.data.ownedShopId && { ownedShopId: response.data.ownedShopId })
    };
    
    console.log("User registered successfully:", user);
    return user;
  } catch (error) {
    // If the server is unreachable, use demo mode
    if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
      console.log("Network error, falling back to demo registration mode");
      const demoUser = simulateDemoRegistration(userData);
      
      // Store demo user data in localStorage
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      localStorage.setItem('authToken', demoUser.token);
      
      console.log("Demo user registered successfully:", demoUser);
      return demoUser;
    }
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Registration failed');
    }
    throw new Error('Registration failed');
  }
};

export const login = async (credentials: Credentials) => {
  try {
    const response = await api.post('/users/login', credentials);
    
    // Validate and type the user data
    const userType = response.data.userType;
    if (userType !== 'customer' && userType !== 'shopOwner' && userType !== 'admin') {
      throw new Error('Invalid user type received from server');
    }
    
    const user: User = {
      id: response.data._id, // Use MongoDB's _id as our id
      email: response.data.email,
      name: response.data.name,
      userType: userType,
      token: response.data.token,
      createdAt: response.data.createdAt,
      ...(response.data.ownedShopId && { ownedShopId: response.data.ownedShopId })
    };
    
    // Store only the auth token in localStorage for API requests
    localStorage.setItem('authToken', user.token);
    
    console.log("User logged in successfully:", user);
    return user;
  } catch (error) {
    // If the server is unreachable, use demo mode
    if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
      console.log("Network error, falling back to demo login mode");
      const demoUser = simulateDemoLogin(credentials.email, credentials.password);
      
      if (!demoUser) {
        throw new Error('Invalid email or password in demo mode');
      }
      
      // Store demo user data in localStorage
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      localStorage.setItem('authToken', demoUser.token);
      
      console.log("Demo user logged in successfully:", demoUser);
      return demoUser;
    }
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Login failed');
    }
    throw new Error('Login failed');
  }
};

export const logout = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Call the logout endpoint if your API has one
      await api.post('/users/logout');
    }
  } catch (error) {
    console.error("Error during logout:", error);
  } finally {
    // Always clear the auth token
    localStorage.removeItem('authToken');
  }
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log("No auth token found");
      return null;
    }

    const response = await api.get('/users/me');
    const userData = response.data;

    // Validate and format user data
    const userType = userData.userType;
    if (userType !== 'customer' && userType !== 'shopOwner' && userType !== 'admin') {
      throw new Error('Invalid user type received from server');
    }
    
    const user: User = {
      id: userData._id,
      email: userData.email,
      name: userData.name,
      userType: userType,
      token,
      createdAt: userData.createdAt,
      ...(userData.ownedShopId && { ownedShopId: userData.ownedShopId })
    };

    console.log("Current user retrieved from API:", user);
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    localStorage.removeItem('authToken'); // Clear invalid token
    return null;
  }
};
