import { NextResponse } from "next/server";
import { auth } from "@/auth";

// In-memory store for OTPs with expiration
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse the JSON body from the request
    const { otp: userOtp } = await req.json();
    console.log("Received OTP:", userOtp);

    if (!userOtp) {
      return NextResponse.json({ message: "OTP is required" }, { status: 400 });
    }

    // Retrieve the stored OTP using the user's email as the key
    const storedOtpData = otpStore.get(session.user.email);
    console.log("Stored OTP Data:", storedOtpData);

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
  } catch (error) {
    console.error("Error in /api/verify-otp:", error);
    return NextResponse.json({ message: "An error occurred while verifying OTP." }, { status: 500 });
  }
}
  