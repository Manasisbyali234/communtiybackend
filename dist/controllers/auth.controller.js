"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
const oauth_service_1 = require("../services/oauth.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.authController = {
    register: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await auth_service_1.authService.register(req.body);
        res.status(201).json(new ApiResponse_1.ApiResponse(201, result, 'Account created successfully'));
    }),
    login: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email, password } = req.body;
        const result = await auth_service_1.authService.login(email, password);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, result, 'Login successful'));
    }),
    logout: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        await auth_service_1.authService.logout(refreshToken);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, null, 'Logged out successfully'));
    }),
    refresh: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        const tokens = await auth_service_1.authService.refreshTokens(refreshToken);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, tokens, 'Tokens refreshed'));
    }),
    verifyEmail: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { code } = req.body;
        await auth_service_1.authService.verifyEmail(req.user.id, code);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, null, 'Email verified successfully'));
    }),
    resendVerification: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await auth_service_1.authService.resendVerification(req.user.id);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, null, 'Verification email sent'));
    }),
    forgotPassword: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email } = req.body;
        await auth_service_1.authService.forgotPassword(email);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, null, 'If this email is registered, a reset code has been sent'));
    }),
    resetPassword: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email, code, newPassword } = req.body;
        await auth_service_1.authService.resetPassword(email, code, newPassword);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, null, 'Password reset successfully'));
    }),
    changePassword: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        await auth_service_1.authService.changePassword(req.user.id, currentPassword, newPassword);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, null, 'Password changed successfully'));
    }),
    // ── Passwordless OTP Login ───────────────────────────────────────────────────
    requestOtpLogin: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email } = req.body;
        await auth_service_1.authService.requestOtpLogin(email);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, null, 'If this email is registered, a login code has been sent'));
    }),
    verifyOtpLogin: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email, code } = req.body;
        const result = await auth_service_1.authService.verifyOtpLogin(email, code);
        res.status(200).json(new ApiResponse_1.ApiResponse(200, result, 'Login successful'));
    }),
    // ── OAuth ────────────────────────────────────────────────────────────────────
    googleSignIn: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { idToken } = req.body;
        const result = await oauth_service_1.oauthService.googleSignIn(idToken);
        const statusCode = result.isNewUser ? 201 : 200;
        res.status(statusCode).json(new ApiResponse_1.ApiResponse(statusCode, result, result.isNewUser ? 'Account created' : 'Login successful'));
    }),
    appleSignIn: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { identityToken } = req.body;
        const result = await oauth_service_1.oauthService.appleSignIn(identityToken);
        const statusCode = result.isNewUser ? 201 : 200;
        res.status(statusCode).json(new ApiResponse_1.ApiResponse(statusCode, result, result.isNewUser ? 'Account created' : 'Login successful'));
    }),
};
//# sourceMappingURL=auth.controller.js.map