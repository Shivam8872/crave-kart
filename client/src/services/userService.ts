
import api from './api';
import axios from 'axios';

export const registerUser = async (userData: {
  email: string;
  password: string;
  name: string;
  userType: "customer" | "shopOwner";
}) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Registration failed');
    }
    throw new Error('Registration failed');
  }
};

export const loginUser = async (credentials: { email: string; password: string }) => {
  try {
    const response = await api.post('/users/login', credentials);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Login failed');
    }
    throw new Error('Login failed');
  }
};

export const updateUser = async (userId: string, userData: any) => {
  try {
    const response = await api.patch(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Update failed');
    }
    throw new Error('Update failed');
  }
};

export const fetchUserById = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch user');
    }
    throw new Error('Failed to fetch user');
  }
};
