import { Router } from 'express';
import { z } from 'zod';
import { authController } from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate';
import { auth } from '../../middleware/auth';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, and underscores only'),
  displayName: z.string().min(1).max(60),
  password: z.string().min(8).max(72),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const OtpSchema = z.object({ code: z.string().length(6) });

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
