
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
  id?: string;
  _id?: string;
  email: string;
  name: string;
  userType: "customer" | "shopOwner" | "admin";
  ownedShopId?: string;
  token?: string;
  createdAt?: Date;
}

// Demo users for offline development/testing
const DEMO_USERS = [
  {
    id: 'demo-customer-1',
    email: 'customer@example.com',
    name: 'Demo Customer',
    userType: 'customer',
    token: 'demo-customer-token',
    createdAt: new Date()
  },
  {
    id: 'demo-shopowner-1',
    email: 'owner@example.com',
    name: 'Demo Shop Owner',
    userType: 'shopOwner',
    ownedShopId: 'demo-shop-1',
    token: 'demo-shopowner-token',
    createdAt: new Date()
  },
  {
    id: 'demo-admin-1',
    email: 'admin@example.com',
    name: 'Demo Admin',
    userType: 'admin',
    token: 'demo-admin-token',
    createdAt: new Date()
  }
];

// Simulate a server response for demo login
const simulateDemoLogin = (email: string, password: string): User | null => {
  // In a real app, we'd check the password with a hash
  // For demo purposes, accept any password for demo users
  const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user && password.length >= 6) {
    return user;
  }
  return null;
};

// Simulate a server response for demo registration
const simulateDemoRegistration = (userData: RegistrationData): User => {
  // Create a new demo user
  const newUser = {
    id: `demo-${userData.userType}-${Date.now()}`,
    email: userData.email,
    name: userData.name,
    userType: userData.userType,
    token: `demo-${userData.userType}-token-${Date.now()}`,
    createdAt: new Date()
  };
  
  // In a real app, we would add this to a database
  return newUser;
};

export const register = async (userData: RegistrationData) => {
  try {
    const response = await api.post('/users', userData);
    
    // Add the token to the response data
    const user = {
      ...response.data,
      token: response.data.token || 'temp-token' // In case your backend doesn't provide a token yet
    };
    
    // Store user data in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', user.token);
    
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
    
    // Add the token to the response data
    const user = {
      ...response.data,
      token: response.data.token || 'temp-token' // In case your backend doesn't provide a token yet
    };
    
    // Store user data in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
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

export const logout = () => {
  console.log("User logging out");
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
};

export const getCurrentUser = async () => {
  const storedUser = localStorage.getItem('currentUser');
  
  if (!storedUser) {
    console.log("No stored user found");
    return null;
  }
  
  try {
    const user = JSON.parse(storedUser);
    console.log("Current user retrieved from storage:", user);
    
    // Ensure the user object has an id property (could be coming from MongoDB as _id)
    if (user._id && !user.id) {
      user.id = user._id;
    }
    
    return user;
  } catch (e) {
    console.error("Error parsing stored user:", e);
    localStorage.removeItem('currentUser');
    return null;
  }
};
