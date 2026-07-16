"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./v1/auth.routes"));
const users_routes_1 = __importDefault(require("./v1/users.routes"));
const posts_routes_1 = __importDefault(require("./v1/posts.routes"));
const communities_routes_1 = __importDefault(require("./v1/communities.routes"));
const stories_routes_1 = __importDefault(require("./v1/stories.routes"));
const messages_routes_1 = __importDefault(require("./v1/messages.routes"));
const events_routes_1 = __importDefault(require("./v1/events.routes"));
const notifications_routes_1 = __importDefault(require("./v1/notifications.routes"));
const media_routes_1 = __importDefault(require("./v1/media.routes"));
const search_routes_1 = __importDefault(require("./v1/search.routes"));
const moderation_routes_1 = __importDefault(require("./v1/moderation.routes"));
const admin_routes_1 = __importDefault(require("./v1/admin.routes"));
const health_routes_1 = __importDefault(require("./v1/health.routes"));
const metrics_routes_1 = __importDefault(require("./v1/metrics.routes"));
const explore_routes_1 = __importDefault(require("./v1/explore.routes"));
const router = (0, express_1.Router)();
// Health — public (no auth required)
router.use('/health', health_routes_1.default);
// Metrics — admin-protected Prometheus endpoint
router.use('/metrics', metrics_routes_1.default);
// Auth
router.use('/auth', auth_routes_1.default);
// Social
router.use('/users', users_routes_1.default);
router.use('/posts', posts_routes_1.default);
router.use('/communities', communities_routes_1.default);
router.use('/stories', stories_routes_1.default);
router.use('/messages', messages_routes_1.default);
router.use('/events', events_routes_1.default);
router.use('/notifications', notifications_routes_1.default);
// Discovery
router.use('/explore', explore_routes_1.default);
router.use('/search', search_routes_1.default);
// Media
router.use('/media', media_routes_1.default);
// Admin & Moderation
router.use('/moderation', moderation_routes_1.default);
router.use('/admin', admin_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map