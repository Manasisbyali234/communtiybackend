"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const index_1 = require("./config/index");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const requestLogger_1 = require("./middleware/requestLogger");
const swagger_1 = require("./docs/swagger");
const routes_1 = __importDefault(require("./routes"));
function buildApp() {
    const app = (0, express_1.default)();
    // 1. Request ID + Structured logging (first, so all logs have request context)
    app.use(requestLogger_1.requestLogger);
    // 2. Security & utility middleware
    app.use((0, helmet_1.default)({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // needed for Swagger UI
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
    }));
    app.use((0, cors_1.default)({
        origin: index_1.config.CORS_ORIGINS.split(',').map((o) => o.trim()),
        credentials: true,
    }));
    app.use((0, compression_1.default)());
    // 3. Body parsing
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // 4. API version header
    app.use((_req, res, next) => {
        res.setHeader('X-API-Version', index_1.config.API_VERSION);
        next();
    });
    // 5. Global rate limiting
    app.use(rateLimiter_1.globalRateLimiter);
    // 6. Routes
    app.use('/api/v1', routes_1.default);
    // 7. Swagger / OpenAPI Docs
    (0, swagger_1.setupSwagger)(app);
    // 8. 404 & Error Handling
    app.use(notFound_1.notFound);
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map