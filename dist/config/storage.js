"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storagePublicUrl = exports.storageBucket = exports.s3 = void 0;
exports.verifyS3Access = verifyS3Access;
const client_s3_1 = require("@aws-sdk/client-s3");
const index_1 = require("./index");
exports.s3 = new client_s3_1.S3Client({
    region: index_1.config.STORAGE_REGION,
    credentials: {
        accessKeyId: index_1.config.STORAGE_ACCESS_KEY,
        secretAccessKey: index_1.config.STORAGE_SECRET_KEY,
    },
});
exports.storageBucket = index_1.config.STORAGE_BUCKET;
exports.storagePublicUrl = index_1.config.STORAGE_PUBLIC_URL;
async function verifyS3Access() {
    try {
        await exports.s3.send(new client_s3_1.HeadBucketCommand({ Bucket: exports.storageBucket }));
        console.log(`✅ S3 bucket "${exports.storageBucket}" accessible`);
    }
    catch (err) {
        console.warn(`⚠️  S3 bucket check failed (${err.name}: ${err.message}). Uploads may fail if bucket/credentials are incorrect.`);
    }
}
//# sourceMappingURL=storage.js.map