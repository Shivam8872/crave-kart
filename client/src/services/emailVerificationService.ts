import api from './api';

interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

export const emailVerificationService = {
  sendOTP: async (email: string): Promise<EmailVerificationResponse> => {
    try {
      const response = await api.post('/api/email/send-verification-otp', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  },

  verifyEmail: async (email: string, otp: string): Promise<EmailVerificationResponse> => {
    try {
      const response = await api.post('/api/email/verify-email', { email, otp });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to verify email');
    }
  },
};