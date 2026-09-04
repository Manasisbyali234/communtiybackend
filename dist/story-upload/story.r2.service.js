"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyR2Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const storage_1 = require("../config/storage");
const config_1 = require("../config");
const STORY_FOLDER = 'stories';
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/avi', 'video/webm', 'video/x-msvideo',
]);
const MAX_SIZE_BYTES = 50 * 1024 * 1024;
function buildKey(originalname) {
    const ext = originalname.includes('.') ? originalname.split('.').pop().toLowerCase() : 'bin';
    const safe = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${STORY_FOLDER}/${Date.now()}_${safe}`;
}
function proxyUrl(key) {
    return `${config_1.config.APP_URL}/api/v1/story-upload/proxy/${encodeURIComponent(key)}`;
}
exports.storyR2Service = {
    validate(file) {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
            throw new Error(`Unsupported file type: ${file.mimetype}. Allowed: jpg, jpeg, png, webp, gif, mp4, mov, avi, webm`);
        }
        if (file.size > MAX_SIZE_BYTES) {
            throw new Error('File too large. Maximum size is 50MB.');
        }
    },
    async upload(file) {
        exports.storyR2Service.validate(file);
        const key = buildKey(file.originalname);
        await storage_1.r2.send(new client_s3_1.PutObjectCommand({
            Bucket: storage_1.storageBucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        return { key, url: proxyUrl(key) };
    },
};
//# sourceMappingURL=story.r2.service.js.map