
import axios from 'axios';

// Extend the Axios request configuration type to include our custom properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    retry?: number;
    retryDelay?: number;
  }
}

// Use environment variables if available or fall back to the deployed backend URL for production
// In production, change this to your actual deployed backend URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 50000, // Set a reasonable timeout
  // Add retries for network errors
  retry: 1,
  retryDelay: 1000
});

// Add a request interceptor to include auth token (for future JWT implementation)
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add authentication token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for better debugging
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      // Get the original request
      const originalRequest = error.config;
      const shouldRetry = originalRequest && originalRequest.retry && originalRequest.retry > 0;
      
      if (error.code === 'ERR_NETWORK' && shouldRetry) {
        originalRequest.retry -= 1;
        console.log(`Network error, retrying... Attempts left: ${originalRequest.retry}`);
        
        // Wait for retryDelay before retrying
        await new Promise(resolve => setTimeout(resolve, originalRequest.retryDelay || 1000));
        return api(originalRequest);
      }
      
      if (error.code === 'ERR_NETWORK') {
        console.error("Network Error: Unable to connect to the server. Please check if the backend is running.");
      } else if (error.response) {
        console.error("API Response Error:", error.response.status, error.response.data);
        
        // Handle authentication errors
        if (error.response.status === 401) {
          // Check if the error is due to an expired token
          if (error.response.data?.message?.includes('expired')) {
            console.error("Authentication token expired");
            // Here you could implement token refresh logic if needed
          }
        }
      } else {
        console.error("API Response Error:", error.message);
      }
    } else {
      console.error("API Response Error:", error);
    }
    
    return Promise.reject(error);
  }
);

export default api;
