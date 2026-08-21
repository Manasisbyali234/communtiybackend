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
const admin_auth_routes_1 = __importDefault(require("./v1/admin-auth.routes"));
const admin_dashboard_routes_1 = __importDefault(require("./v1/admin-dashboard.routes"));
const health_routes_1 = __importDefault(require("./v1/health.routes"));
const metrics_routes_1 = __importDefault(require("./v1/metrics.routes"));
const explore_routes_1 = __importDefault(require("./v1/explore.routes"));
const connections_routes_1 = __importDefault(require("./v1/connections.routes"));
const story_upload_routes_1 = __importDefault(require("../story-upload/story.upload.routes"));
const marketRates_routes_1 = __importDefault(require("./v1/marketRates.routes"));
const referral_routes_1 = __importDefault(require("./v1/referral.routes"));
const jobs_routes_1 = __importDefault(require("./v1/jobs.routes"));
const matrimony_routes_1 = __importDefault(require("./v1/matrimony.routes"));
const directory_routes_1 = __importDefault(require("./v1/directory.routes"));
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
// Connections
router.use('/connections', connections_routes_1.default);
// Discovery
router.use('/explore', explore_routes_1.default);
router.use('/search', search_routes_1.default);
// Media
router.use('/media', media_routes_1.default);
// Story Upload (isolated — stories/ S3 folder only)
router.use('/story-upload', story_upload_routes_1.default);
// Market Rates
router.use('/market-rates', marketRates_routes_1.default);
// Referral tracking
router.use('/referral', referral_routes_1.default);
// Jobs & Recruitment
router.use('/jobs', jobs_routes_1.default);
// Matrimony
router.use('/matrimony', matrimony_routes_1.default);
// Business Directory, Community Help, and Our People
router.use('/', directory_routes_1.default);
// Admin & Moderation
router.use('/moderation', moderation_routes_1.default);
router.use('/admin', admin_routes_1.default);
// Separate Admin Panel (no user JWT — uses AdminSession)
router.use('/admin-auth', admin_auth_routes_1.default);
router.use('/admin-panel', admin_dashboard_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map