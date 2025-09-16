import api from './api';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import React from 'react';

// Replace with your Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RBDguFl3BQt5yGJQVRBYghYYCRAaOmTMjBYVKpQPlKDIPhMz1UGh4NkpNKyjK4zFXYk1RTH9tbjIJtSG24LUkso00C0Uf6Kr6';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Create a payment intent for an order
export const createPaymentIntent = async (orderData: {
  totalAmount: number;
  currency?: string;
  orderId?: string;
}) => {
  try {
    const { totalAmount, currency = 'inr', orderId } = orderData;

    console.log('Creating payment intent for amount:', totalAmount);

    const response = await api.post('/payments/create-intent', {
      amount: Math.round(totalAmount * 100),
      currency,
      orderId,
    });

    console.log('Payment intent created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to process payment');
    }
    throw new Error('Failed to process payment');
  }
};

// Handle successful payment
export const handleSuccessfulPayment = async (orderId: string, paymentIntentId: string) => {
  try {
    const response = await api.post(`/payments/confirm/${orderId}`, {
      paymentIntentId,
    });
    return response.data;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

// Process a payment using Stripe Elements (CardElement)
export const useProcessPayment = () => {
  const stripe = useStripe();
  const elements = useElements();

  const processPayment = async (clientSecret: string, orderId: string) => {
    try {
      if (!stripe || !elements) throw new Error('Stripe not loaded');

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Customer', // Optional: replace with real name if available
          },
        },
      });

      if (error) {
        console.error('Stripe confirm error:', error.message);
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        await handleSuccessfulPayment(orderId, paymentIntent.id);
        return paymentIntent;
      } else {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      throw err;
    }
  };

  return { processPayment };
};
