"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = generateOtp;
exports.otpExpiresAt = otpExpiresAt;
const crypto_1 = require("crypto");
/**
 * Generate a cryptographically random 6-digit OTP code.
 */
function generateOtp() {
    return String((0, crypto_1.randomInt)(100000, 999999));
}
/**
 * Compute the expiry date for an OTP.
 */
function otpExpiresAt(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
}
//# sourceMappingURL=otp.js.map