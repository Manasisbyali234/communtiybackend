import { Router } from 'express';
import { z } from 'zod';
import { authController } from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate';
import { auth } from '../../middleware/auth';

const router = Router();

const parseDob = (value?: string) => {
  if (!value) return null;
  const normalized = value.includes('/')
    ? value.split('/').reverse().join('-')
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isAtLeastAge = (value?: string, minimumAge = 18) => {
  const dob = parseDob(value);
  if (!dob) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (today < birthdayThisYear) age -= 1;
  return age >= minimumAge;
};

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, and underscores only'),
  displayName: z.string().min(1).max(60),
  password: z.string().min(8).max(72),
  phone: z.string().min(10).max(20).optional(),
  familyName: z.string().min(1).max(60).optional(),
  dob: z.string().max(20).optional().refine(
    (value) => !value || isAtLeastAge(value),
    'You must be at least 18 years old to register'
  ),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  country: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  district: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  nativePlace: z.string().max(120).optional(),
  currentLocation: z.string().max(120).optional(),
  occupation: z.string().max(80).optional(),
  profession: z.string().max(80).optional(),
  company: z.string().max(120).optional(),
  education: z.string().max(120).optional(),
  skills: z.string().max(300).optional(),
  referredById: z.string().min(1).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const OtpSchema = z.object({ code: z.string().length(6) });
const PhoneOtpSchema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().length(6),
});
const ResendPhoneOtpSchema = z.object({
  phone: z.string().min(10).max(20),
});

const RefreshSchema = z.object({ refreshToken: z.string().min(1) });

const ForgotPasswordSchema = z.object({ email: z.string().email() });

const ResetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8).max(72),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

const OtpLoginRequestSchema = z.object({ email: z.string().email() });

const OtpLoginVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const GoogleSchema = z.object({ idToken: z.string().min(1) });
const AppleSchema = z.object({ identityToken: z.string().min(1) });

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/register', validate({ body: RegisterSchema }), authController.register);
router.post('/login', validate({ body: LoginSchema }), authController.login);
router.post('/refresh', validate({ body: RefreshSchema }), authController.refresh);
router.post('/forgot-password', validate({ body: ForgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', validate({ body: ResetPasswordSchema }), authController.resetPassword);
router.post('/verify-phone', auth, validate({ body: PhoneOtpSchema }), authController.verifyPhone);
router.post('/resend-phone-otp', auth, validate({ body: ResendPhoneOtpSchema }), authController.resendPhoneOtp);

// Passwordless OTP login
router.post('/otp-login', validate({ body: OtpLoginRequestSchema }), authController.requestOtpLogin);
router.post('/otp-verify', validate({ body: OtpLoginVerifySchema }), authController.verifyOtpLogin);

// Social sign-in
router.post('/google', validate({ body: GoogleSchema }), authController.googleSignIn);
router.post('/apple', validate({ body: AppleSchema }), authController.appleSignIn);

// ── Protected routes ──────────────────────────────────────────────────────────
router.post('/logout', auth, validate({ body: RefreshSchema }), authController.logout);
router.post('/verify-email', auth, validate({ body: OtpSchema }), authController.verifyEmail);
router.post('/resend-verification', auth, authController.resendVerification);
router.post('/change-password', auth, validate({ body: ChangePasswordSchema }), authController.changePassword);

export default router;
