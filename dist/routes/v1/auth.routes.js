"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_controller_1 = require("../../controllers/auth.controller");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const parseDob = (value) => {
    if (!value)
        return null;
    const normalized = value.includes('/')
        ? value.split('/').reverse().join('-')
        : value;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
};
const isAtLeastAge = (value, minimumAge = 18) => {
    const dob = parseDob(value);
    if (!dob)
        return false;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (today < birthdayThisYear)
        age -= 1;
    return age >= minimumAge;
};
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, and underscores only'),
    displayName: zod_1.z.string().min(1).max(60),
    password: zod_1.z.string().min(8).max(72),
    phone: zod_1.z.string().min(10).max(20).optional(),
    familyName: zod_1.z.string().min(1).max(60).optional(),
    dob: zod_1.z.string().max(20).optional().refine((value) => !value || isAtLeastAge(value), 'You must be at least 18 years old to register'),
    gender: zod_1.z.enum(['Male', 'Female', 'Other']).optional(),
    country: zod_1.z.string().max(80).optional(),
    state: zod_1.z.string().max(80).optional(),
    district: zod_1.z.string().max(80).optional(),
    city: zod_1.z.string().max(80).optional(),
    nativePlace: zod_1.z.string().max(120).optional(),
    currentLocation: zod_1.z.string().max(120).optional(),
    occupation: zod_1.z.string().max(80).optional(),
    profession: zod_1.z.string().max(80).optional(),
    company: zod_1.z.string().max(120).optional(),
    education: zod_1.z.string().max(120).optional(),
    skills: zod_1.z.string().max(300).optional(),
    referredById: zod_1.z.string().min(1).optional(),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const OtpSchema = zod_1.z.object({ code: zod_1.z.string().length(6) });
const PhoneOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().min(10).max(20),
    code: zod_1.z.string().length(6),
});
const ResendPhoneOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().min(10).max(20),
});
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
router.post('/register', (0, validate_1.validate)({ body: RegisterSchema }), auth_controller_1.authController.register);
router.post('/login', (0, validate_1.validate)({ body: LoginSchema }), auth_controller_1.authController.login);
router.post('/refresh', (0, validate_1.validate)({ body: RefreshSchema }), auth_controller_1.authController.refresh);
router.post('/forgot-password', (0, validate_1.validate)({ body: ForgotPasswordSchema }), auth_controller_1.authController.forgotPassword);
router.post('/reset-password', (0, validate_1.validate)({ body: ResetPasswordSchema }), auth_controller_1.authController.resetPassword);
router.post('/verify-phone', auth_1.auth, (0, validate_1.validate)({ body: PhoneOtpSchema }), auth_controller_1.authController.verifyPhone);
router.post('/resend-phone-otp', auth_1.auth, (0, validate_1.validate)({ body: ResendPhoneOtpSchema }), auth_controller_1.authController.resendPhoneOtp);
// Passwordless OTP login
router.post('/otp-login', (0, validate_1.validate)({ body: OtpLoginRequestSchema }), auth_controller_1.authController.requestOtpLogin);
router.post('/otp-verify', (0, validate_1.validate)({ body: OtpLoginVerifySchema }), auth_controller_1.authController.verifyOtpLogin);
// Social sign-in
router.post('/google', (0, validate_1.validate)({ body: GoogleSchema }), auth_controller_1.authController.googleSignIn);
router.post('/apple', (0, validate_1.validate)({ body: AppleSchema }), auth_controller_1.authController.appleSignIn);
// ── Protected routes ──────────────────────────────────────────────────────────
router.post('/logout', auth_1.auth, (0, validate_1.validate)({ body: RefreshSchema }), auth_controller_1.authController.logout);
router.post('/verify-email', auth_1.auth, (0, validate_1.validate)({ body: OtpSchema }), auth_controller_1.authController.verifyEmail);
router.post('/resend-verification', auth_1.auth, auth_controller_1.authController.resendVerification);
router.post('/change-password', auth_1.auth, (0, validate_1.validate)({ body: ChangePasswordSchema }), auth_controller_1.authController.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map