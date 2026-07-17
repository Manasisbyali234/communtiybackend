import { randomInt } from 'crypto';

/**
 * Generate a cryptographically random 6-digit OTP code.
 */
export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

/**
 * Compute the expiry date for an OTP.
 */
export function otpExpiresAt(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
