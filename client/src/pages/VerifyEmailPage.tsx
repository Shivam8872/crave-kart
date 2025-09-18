import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useAuth } from '@/contexts/AuthContext';

const VerifyEmailPage = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const userData = location.state?.userData;
  
  useEffect(() => {
    if (!userData) {
      navigate('/signup');
      return;
    }
    // Send OTP when component mounts
    handleSendOTP();
  }, []);

  const handleSendOTP = async () => {
    try {
      setSendingOtp(true);
      const response = await fetch('http://localhost:5000/api/email/send-verification-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userData.email }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Verification code sent! Please check your email.');
      } else {
        throw new Error(data.message || 'Failed to send verification code');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.error('Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/email/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userData.email, otp }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Set the current user with email verified
        setCurrentUser({
          ...userData,
          isEmailVerified: true
        });

        toast.success('Email verified successfully!');
        
        // Redirect based on user type
        if (userData.userType === 'admin') {
          navigate('/admin');
        } else if (userData.userType === 'shopOwner') {
          navigate('/register-shop');
        } else {
          navigate('/');
        }
      } else {
        throw new Error(data.message || 'Invalid verification code');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Verify Your Email</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Enter the verification code sent to {userData?.email}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-wider"
              />
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
                  'Verify Email'
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
                  'Resend Code'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default VerifyEmailPage;