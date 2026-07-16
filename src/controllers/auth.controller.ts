import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { oauthService } from '../services/oauth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body as { email: string; username: string; displayName: string; password: string });
    res.status(201).json(new ApiResponse(201, result, 'Account created successfully'));
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await authService.login(email, password);
    res.status(200).json(new ApiResponse(200, result, 'Login successful'));
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken: string };
    await authService.logout(refreshToken);
    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken: string };
    const tokens = await authService.refreshTokens(refreshToken);
    res.status(200).json(new ApiResponse(200, tokens, 'Tokens refreshed'));
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body as { code: string };
    await authService.verifyEmail(req.user.id, code);
    res.status(200).json(new ApiResponse(200, null, 'Email verified successfully'));
  }),

  resendVerification: asyncHandler(async (req: Request, res: Response) => {
    await authService.resendVerification(req.user.id);
    res.status(200).json(new ApiResponse(200, null, 'Verification email sent'));
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    await authService.forgotPassword(email);
    res.status(200).json(new ApiResponse(200, null, 'If this email is registered, a reset code has been sent'));
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body as { email: string; code: string; newPassword: string };
    await authService.resetPassword(email, code, newPassword);
    res.status(200).json(new ApiResponse(200, null, 'Password reset successfully'));
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
  }),

  // ── Passwordless OTP Login ───────────────────────────────────────────────────
  requestOtpLogin: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    await authService.requestOtpLogin(email);
    res.status(200).json(new ApiResponse(200, null, 'If this email is registered, a login code has been sent'));
  }),

  verifyOtpLogin: asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body as { email: string; code: string };
    const result = await authService.verifyOtpLogin(email, code);
    res.status(200).json(new ApiResponse(200, result, 'Login successful'));
  }),

  // ── OAuth ────────────────────────────────────────────────────────────────────
  googleSignIn: asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body as { idToken: string };
    const result = await oauthService.googleSignIn(idToken);
    const statusCode = result.isNewUser ? 201 : 200;
    res.status(statusCode).json(new ApiResponse(statusCode, result, result.isNewUser ? 'Account created' : 'Login successful'));
  }),

  appleSignIn: asyncHandler(async (req: Request, res: Response) => {
    const { identityToken } = req.body as { identityToken: string };
    const result = await oauthService.appleSignIn(identityToken);
    const statusCode = result.isNewUser ? 201 : 200;
    res.status(statusCode).json(new ApiResponse(statusCode, result, result.isNewUser ? 'Account created' : 'Login successful'));
  }),
};
