
import api from './api';
import axios from 'axios';

interface SavedAddress {
  id?: string;
  userId: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export const getSavedAddresses = async (userId: string): Promise<SavedAddress[]> => {
  try {
    // Try to get addresses from API first
    try {
      const response = await api.get(`/addresses/user/${userId}`);
      console.log('Fetched saved addresses from API:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching addresses from API, falling back to local storage:', error);
      
      // Fall back to local storage
      const localAddresses = localStorage.getItem(`addresses_${userId}`);
      if (localAddresses) {
        return JSON.parse(localAddresses);
      }
      return [];
    }
  } catch (error) {
    console.error('Error fetching saved addresses:', error);
    return [];
  }
};

export const saveAddress = async (address: SavedAddress): Promise<SavedAddress> => {
  try {
    // Try to save to API first
    try {
      const response = await api.post('/addresses', address);
      console.log('Saved address to API:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error saving address to API, falling back to local storage:', error);
      
      // Fall back to local storage
      const userId = address.userId;
      const localAddresses = localStorage.getItem(`addresses_${userId}`) || '[]';
      const addresses = JSON.parse(localAddresses);
      
      // Generate local ID if none exists
      const newAddress = { 
        ...address, 
        id: address.id || `local_${Date.now()}`
      };
      
      // If this is the default address, remove default flag from others
      if (newAddress.isDefault) {
        addresses.forEach((addr: SavedAddress) => {
          addr.isDefault = false;
        });
      }
      
      addresses.push(newAddress);
      localStorage.setItem(`addresses_${userId}`, JSON.stringify(addresses));
      
      return newAddress;
    }
  } catch (error) {
    console.error('Error saving address:', error);
    throw new Error('Failed to save address');
  }
};

export const updateAddress = async (address: SavedAddress): Promise<SavedAddress> => {
  try {
    // Try to update via API first
    try {
      const response = await api.put(`/addresses/${address.id}`, address);
      console.log('Updated address in API:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating address in API, falling back to local storage:', error);
      
      // Fall back to local storage
      const userId = address.userId;
      const localAddresses = localStorage.getItem(`addresses_${userId}`) || '[]';
      const addresses = JSON.parse(localAddresses);
      
      // Find the address to update
      const index = addresses.findIndex((addr: SavedAddress) => addr.id === address.id);
      if (index !== -1) {
        // If this is the default address, remove default flag from others
        if (address.isDefault) {
          addresses.forEach((addr: SavedAddress) => {
            addr.isDefault = false;
          });
        }
        
        addresses[index] = address;
        localStorage.setItem(`addresses_${userId}`, JSON.stringify(addresses));
        return address;
      } else {
        throw new Error('Address not found');
      }
    }
  } catch (error) {
    console.error('Error updating address:', error);
    throw new Error('Failed to update address');
  }
};

export const deleteAddress = async (userId: string, addressId: string): Promise<void> => {
  try {
    // Try to delete from API first
    try {
      await api.delete(`/addresses/${addressId}`);
      console.log('Deleted address from API');
    } catch (error) {
      console.error('Error deleting address from API, falling back to local storage:', error);
      
      // Fall back to local storage
      const localAddresses = localStorage.getItem(`addresses_${userId}`) || '[]';
      const addresses = JSON.parse(localAddresses);
      
      const filteredAddresses = addresses.filter((addr: SavedAddress) => addr.id !== addressId);
      localStorage.setItem(`addresses_${userId}`, JSON.stringify(filteredAddresses));
    }
  } catch (error) {
    console.error('Error deleting address:', error);
    throw new Error('Failed to delete address');
  }
};
