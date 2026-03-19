import crypto from "crypto";
import bcrypt from "bcrypt";

export async function generateOtp() {
  const otp = crypto.randomInt(100000, 1000000);
  const generationTime = new Date();
  const hashedOtp = await bcrypt.hash(`${otp}`, 10);
  return {
    otp,
    generationTime,
    hashedOtp,
  };
}

export async function verifyOtp(otpData, inputOTP) {
  const currentTime = new Date();
  const generationTime = new Date(otpData.generationTime);
  const validTill = new Date(generationTime.getTime() + 5 * 60000);

  if (currentTime > validTill) {
    return false;
  }

  return await bcrypt.compare(String(inputOTP), otpData.hashedOtp);
}
