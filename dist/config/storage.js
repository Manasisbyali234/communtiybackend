"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.r2 = exports.storagePublicUrl = exports.storageBucket = void 0;
exports.verifyR2Access = verifyR2Access;
const client_s3_1 = require("@aws-sdk/client-s3");
const index_1 = require("./index");
function requireStorageValue(name, value) {
    if (!value) {
        throw new Error(`Missing required Cloudflare R2 environment variable: ${name}`);
    }
    return value;
}
function stripTrailingSlash(value) {
    return value.replace(/\/+$/, '');
}
const r2Endpoint = stripTrailingSlash(requireStorageValue('R2_ENDPOINT', index_1.config.R2_ENDPOINT));
const r2AccessKeyId = requireStorageValue('R2_ACCESS_KEY_ID', index_1.config.R2_ACCESS_KEY_ID ?? index_1.config.STORAGE_ACCESS_KEY);
const r2SecretAccessKey = requireStorageValue('R2_SECRET_ACCESS_KEY', index_1.config.R2_SECRET_ACCESS_KEY ?? index_1.config.STORAGE_SECRET_KEY);
exports.storageBucket = requireStorageValue('R2_BUCKET_NAME', index_1.config.R2_BUCKET_NAME ?? index_1.config.STORAGE_BUCKET);
exports.storagePublicUrl = index_1.config.R2_PUBLIC_URL
    ? stripTrailingSlash(index_1.config.R2_PUBLIC_URL)
    : index_1.config.STORAGE_PUBLIC_URL
        ? stripTrailingSlash(index_1.config.STORAGE_PUBLIC_URL)
        : undefined;
exports.r2 = new client_s3_1.S3Client({
    region: index_1.config.R2_REGION ?? index_1.config.STORAGE_REGION ?? 'auto',
    endpoint: r2Endpoint,
    forcePathStyle: true,
    credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
    },
});
async function verifyR2Access() {
    try {
        await exports.r2.send(new client_s3_1.HeadBucketCommand({ Bucket: exports.storageBucket }));
        console.log(`Cloudflare R2 bucket "${exports.storageBucket}" accessible`);
    }
    catch (err) {
        console.warn(`Cloudflare R2 bucket check failed (${err.name}: ${err.message}). Uploads may fail if bucket/credentials are incorrect.`);
    }
}
//# sourceMappingURL=storage.js.map