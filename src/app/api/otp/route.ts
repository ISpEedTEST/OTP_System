import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/auth";

// In-memory store for OTPs with expiration
const otpStore = new Map<string, { otp: string; expires: number }>();

// Set up the email transporter using Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Updated generateOtp function to include both numbers and characters
function generateOtp() {
  const chars = '0123456789';
  let otp = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    otp += chars[randomIndex];
  }
  
  return otp;
}

async function sendOtpEmail(to: string, otp: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`,
    });
    console.log('OTP sent successfully');
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { action, otp: userOtp } = await req.json();

    if (action === 'send') {
      // Generate OTP with both numbers and letters
      const otp = generateOtp();
      const expires = Date.now() + 1 * 60 * 1000; // 1 minute expiration

      // Store OTP
      otpStore.set(session.user.email, { otp, expires });

      // Send OTP via email
      await sendOtpEmail(session.user.email, otp);

      return NextResponse.json({ message: "OTP sent successfully" });
    } else if (action === 'verify') {
      if (!userOtp) {
        return NextResponse.json({ message: "OTP is required" }, { status: 400 });
      }

      // Retrieve the stored OTP using the user's email as the key
      const storedOtpData = otpStore.get(session.user.email);

      if (!storedOtpData || Date.now() > storedOtpData.expires) {
        // OTP not found or expired
        otpStore.delete(session.user.email); // Clean up expired OTP
        return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
      }

      if (userOtp === storedOtpData.otp) {
        // OTP is correct, remove it from the store
        otpStore.delete(session.user.email);
        return NextResponse.json({ message: "OTP verified successfully" }, { status: 200 });
      } else {
        return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/otp:", error);
    return NextResponse.json({ message: "An error occurred while handling OTP." }, { status: 500 });
  }
}
