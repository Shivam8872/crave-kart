import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '../hooks/use-toast';

interface EmailVerificationProps {
  email: string;
  onVerificationComplete?: () => void;
  className?: string;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerificationComplete,
  className = '',
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(true); // Show OTP input by default
  const { toast } = useToast();

  const handleSendOTP = async () => {
    try {
      setSendingOtp(true);
      const response = await fetch('http://localhost:5000/api/email/send-verification-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
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
      const response = await fetch('http://localhost:5000/api/email/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success!',
          description: 'Email verified successfully',
          variant: 'default',
        });
        onVerificationComplete?.();
      } else {
        throw new Error(data.message || 'Invalid OTP');
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