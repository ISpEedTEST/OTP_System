"use client";
import { useState } from 'react';

const RequestOTP = () => {
  const [message, setMessage] = useState('');

  const handleRequest = async () => {
    try {
      const response = await fetch('/api/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'send' }), // Request to send OTP
      });

      const data = await response.json();
      setMessage(data.message || 'An error occurred');
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while requesting OTP.');
    }
  };

  return (
    <div>
      <button onClick={handleRequest}>Request OTP</button>
      <p>{message}</p>
    </div>
  );
};

export default RequestOTP;
