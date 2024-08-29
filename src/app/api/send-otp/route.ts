import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/auth";

// In-memory store for OTPs with expiration
const otpStore = new Map<string, { otp: string; expires: number }>();

// Set up the email transporter using Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Generate a random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration time (e.g., 1 minute)
    const expires = Date.now() + 1 * 60 * 1000; // 1 minute
    otpStore.set(session.user.email, { otp, expires });

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: session.user.email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}`,
    });
    console.log("Stored OTP data:", otpStore.get(session.user.email));

    // Return success response
    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in /api/send-otp:", error);
    return NextResponse.json({ message: "An error occurred while sending OTP." }, { status: 500 });
  }
}
