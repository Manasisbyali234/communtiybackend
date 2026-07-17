"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_controller_1 = require("../../controllers/auth.controller");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const router = (0, express_1.Router)();
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, and underscores only'),
    displayName: zod_1.z.string().min(1).max(60),
    password: zod_1.z.string().min(8).max(72),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const OtpSchema = zod_1.z.object({ code: zod_1.z.string().length(6) });
const RefreshSchema = zod_1.z.object({ refreshToken: zod_1.z.string().min(1) });
const ForgotPasswordSchema = zod_1.z.object({ email: zod_1.z.string().email() });
const ResetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().length(6),
    newPassword: zod_1.z.string().min(8).max(72),
});
const ChangePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8).max(72),
});
const OtpLoginRequestSchema = zod_1.z.object({ email: zod_1.z.string().email() });
const OtpLoginVerifySchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().length(6),
});
const GoogleSchema = zod_1.z.object({ idToken: zod_1.z.string().min(1) });
const AppleSchema = zod_1.z.object({ identityToken: zod_1.z.string().min(1) });
// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/register', rateLimiter_1.authRateLimiter, (0, validate_1.validate)({ body: RegisterSchema }), auth_controller_1.authController.register);
router.post('/login', rateLimiter_1.authRateLimiter, (0, validate_1.validate)({ body: LoginSchema }), auth_controller_1.authController.login);
router.post('/refresh', (0, validate_1.validate)({ body: RefreshSchema }), auth_controller_1.authController.refresh);
router.post('/forgot-password', rateLimiter_1.authRateLimiter, (0, validate_1.validate)({ body: ForgotPasswordSchema }), auth_controller_1.authController.forgotPassword);
router.post('/reset-password', rateLimiter_1.authRateLimiter, (0, validate_1.validate)({ body: ResetPasswordSchema }), auth_controller_1.authController.resetPassword);
// Passwordless OTP login
router.post('/otp-login', rateLimiter_1.authRateLimiter, (0, validate_1.validate)({ body: OtpLoginRequestSchema }), auth_controller_1.authController.requestOtpLogin);
router.post('/otp-verify', rateLimiter_1.authRateLimiter, (0, validate_1.validate)({ body: OtpLoginVerifySchema }), auth_controller_1.authController.verifyOtpLogin);
// Social sign-in
router.post('/google', rateLimiter_1.authRateLimiter, (0, validate_1.validate)({ body: GoogleSchema }), auth_controller_1.authController.googleSignIn);
router.post('/apple', rateLimiter_1.authRateLimiter, (0, validate_1.validate)({ body: AppleSchema }), auth_controller_1.authController.appleSignIn);
// ── Protected routes ──────────────────────────────────────────────────────────
router.post('/logout', auth_1.auth, (0, validate_1.validate)({ body: RefreshSchema }), auth_controller_1.authController.logout);
router.post('/verify-email', auth_1.auth, (0, validate_1.validate)({ body: OtpSchema }), auth_controller_1.authController.verifyEmail);
router.post('/resend-verification', auth_1.auth, auth_controller_1.authController.resendVerification);
router.post('/change-password', auth_1.auth, (0, validate_1.validate)({ body: ChangePasswordSchema }), auth_controller_1.authController.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map