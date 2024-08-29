"use client";
import { useState } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";// Assuming you're using Button component from Shadcn
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false); // State for loading

  const handleVerifyOtp = async (otp: string) => {
    try {
      setLoading(true); // Start loading
      const response = await fetch('/api/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'verify', otp }), // Send OTP for verification
      });

      const data = await response.json();
      if (response.ok) {
        return true; // OTP verified successfully
      } else {
        setMessage(data.message || 'OTP verification failed');
        return false; // OTP verification failed
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      setMessage('An error occurred while verifying OTP.');
      return false; // OTP verification failed
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true); // Start loading
      const response = await fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsSubscriber(true);
        setExpirationDate(new Date(data.expirationDate));
        setMessage('Subscription successful!');
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      console.error('Error during subscription:', error);
      setMessage('Subscription failed. Please try again.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const otpVerified = await handleVerifyOtp(otp);
    if (otpVerified) {
      await handleSubscribe();
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
  };
  const isOtpComplete = otp.length === 6;

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="otp">Enter OTP:</label>

      <InputOTP maxLength={6} id="otp" required onChange={handleOtpChange}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>

      <Button type="submit" disabled={loading || !isOtpComplete} className="flex items-center space-x-2">
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        <span>{loading ? 'Verifying...' : 'Verify OTP'}</span>
      </Button>
      <p>{message}</p>

      {isSubscriber && expirationDate && (
        <p>Subscription expires on: {expirationDate.toLocaleDateString()}</p>
      )}
    </form>
  );
}

export default VerifyOTP;
