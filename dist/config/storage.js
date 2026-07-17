"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storagePublicUrl = exports.storageBucket = exports.s3 = void 0;
const logger_1 = require("./logger");
// Using PostgreSQL for media storage instead of S3/R2
exports.s3 = null;
exports.storageBucket = 'postgresql';
exports.storagePublicUrl = 'http://localhost:3000/api/v1/media';
logger_1.logger.info('Using PostgreSQL for media storage instead of S3/R2');
//# sourceMappingURL=storage.js.map