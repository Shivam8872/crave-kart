import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

interface EmailVerificationProps {
  email: string;
  // mode: 'pre' for pre-registration verification, 'post' for after account exists
  mode?: 'pre' | 'post';
  // For pre mode, we'll pass emailVerifiedToken back via this callback
  onVerificationComplete?: (payload?: { emailVerifiedToken?: string }) => void;
  className?: string;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  mode = 'post',
  onVerificationComplete,
  className = '',
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(true); // Show OTP input by default
  const { toast } = useToast();
  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();

  // Auto-send OTP when component mounts
  useEffect(() => {
    handleSendOTP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendOTP = async () => {
    try {
      setSendingOtp(true);
      const response = await api.post('/api/email/send-verification-otp', { email });
      const data = response.data;
      
      if (data.success) {
        toast({
          title: 'OTP Sent!',
          description: 'Please check your email for the verification code.',
          variant: 'default',
        });
        setShowOtpInput(true);
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast({
        title: 'Error',
        description: 'Please enter the OTP',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      if (mode === 'pre') {
        // Pre-registration: only verify OTP and return token to parent
        const response = await api.post('/api/email/verify-otp', { email, otp });
        const data = response.data;
        if (data.success) {
          toast({ title: 'Success!', description: 'OTP verified', variant: 'default' });
          onVerificationComplete?.({ emailVerifiedToken: data.emailVerifiedToken });
        } else {
          throw new Error(data.message || 'Invalid OTP');
        }
      } else {
        // Post-registration: verify and log user in
        const response = await api.post('/api/email/verify-email', { email, otp });
        const data = response.data;
        if (data.success) {
          // Persist session so user is logged in directly after verification
          const updatedUser = data.user ?? { email, isEmailVerified: true };
          const token = data.token;

          if (token) {
            localStorage.setItem('authToken', token);
          }
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);

          toast({ title: 'Success!', description: 'Email verified successfully', variant: 'default' });

          // Navigate based on role if available
          const role = updatedUser.userType;
          if (role === 'admin') {
            navigate('/admin');
          } else if (role === 'shopOwner') {
            navigate('/register-shop');
          } else {
            navigate('/');
          }

          onVerificationComplete?.();
        } else {
          throw new Error(data.message || 'Invalid OTP');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="text-center text-lg tracking-wider"
          />
          <p className="text-sm text-gray-500">
            Enter the verification code sent to your email
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleVerifyOTP}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Spinner className="mr-2" />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </Button>
          <Button
            onClick={handleSendOTP}
            disabled={sendingOtp}
            variant="outline"
          >
            {sendingOtp ? (
              <Spinner className="h-4 w-4" />
            ) : (
              'Resend OTP'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};