
import api from './api';
import axios from 'axios';

export interface Review {
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  orderId?: string;
  shopResponse?: {
    response: string;
    createdAt: string;
  };
}

interface ReviewData {
  shopId: string;
  rating: number;
  comment: string;
  orderId?: string;
}

export const getShopReviews = async (shopId: string): Promise<Review[]> => {
  try {
    const response = await api.get(`/reviews/shop/${shopId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching shop reviews:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch reviews');
    }
    throw new Error('Failed to fetch reviews');
  }
};

export const getUserReviews = async (userId: string): Promise<Review[]> => {
  try {
    const response = await api.get(`/reviews/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch reviews');
    }
    throw new Error('Failed to fetch reviews');
  }
};

export const addReview = async (reviewData: ReviewData): Promise<Review> => {
  try {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  } catch (error) {
    console.error('Error adding review:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to add review');
    }
    throw new Error('Failed to add review');
  }
};

export const addReviewResponse = async (reviewId: string, response: string) => {
  try {
    const responseData = await api.post(`/reviews/${reviewId}/response`, { response });
    return responseData.data;
  } catch (error) {
    console.error('Error adding review response:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to add response');
    }
    throw new Error('Failed to add response');
  }
};

export const updateReview = async (reviewId: string, reviewData: Partial<ReviewData>) => {
  try {
    const response = await api.patch(`/reviews/${reviewId}`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error updating review:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to update review');
    }
    throw new Error('Failed to update review');
  }
};

export const deleteReview = async (reviewId: string) => {
  try {
    await api.delete(`/reviews/${reviewId}`);
    return true;
  } catch (error) {
    console.error('Error deleting review:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to delete review');
    }
    throw new Error('Failed to delete review');
  }
};
