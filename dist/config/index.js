"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    API_VERSION: zod_1.z.string().default('v1'),
    APP_URL: zod_1.z.string().url().default('http://localhost:3000'),
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().url(),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('30d'),
    OTP_EXPIRY_MINUTES: zod_1.z.coerce.number().default(10),
    // OAuth
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    APPLE_CLIENT_ID: zod_1.z.string().optional(),
    APPLE_TEAM_ID: zod_1.z.string().optional(),
    APPLE_KEY_ID: zod_1.z.string().optional(),
    APPLE_PRIVATE_KEY: zod_1.z.string().optional(),
    // Storage
    STORAGE_ENDPOINT: zod_1.z.string().url().optional(),
    STORAGE_REGION: zod_1.z.string().default('auto'),
    STORAGE_ACCESS_KEY: zod_1.z.string().optional(),
    STORAGE_SECRET_KEY: zod_1.z.string().optional(),
    STORAGE_BUCKET: zod_1.z.string().default('community-media'),
    STORAGE_PUBLIC_URL: zod_1.z.string().url().optional(),
    // Email
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().email().default('noreply@community.app'),
    // Push
    EXPO_ACCESS_TOKEN: zod_1.z.string().optional(),
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(60000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
    // CORS
    CORS_ORIGINS: zod_1.z.string().default('http://localhost:8081'),
    // Swagger
    SWAGGER_ENABLED: zod_1.z.coerce.boolean().default(true),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.config = parsed.data;
//# sourceMappingURL=index.js.map