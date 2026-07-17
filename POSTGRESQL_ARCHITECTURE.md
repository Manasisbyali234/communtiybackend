# PostgreSQL-Based Storage Architecture

This backend has been configured to store ALL data in PostgreSQL, eliminating the need for Redis and S3/R2.

## What Changed

### 1. Media Storage
- **Before**: Files stored in S3/Cloudflare R2
- **After**: Files stored as binary data (`BYTEA`) in PostgreSQL `MediaFile` table

### 2. Caching
- **Before**: Redis for caching and temporary data
- **After**: PostgreSQL `CacheEntry` table with expiration support

### 3. Job Queue
- **Before**: BullMQ with Redis backend
- **After**: Simple PostgreSQL-based job queue using cache service

### 4. Session Storage
- **Before**: Mixed (some in Redis, some in PostgreSQL)
- **After**: All session data in PostgreSQL (refresh tokens, OTP codes)

## New Database Tables

### MediaFile
```sql
CREATE TABLE MediaFile (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    originalName TEXT NOT NULL,
    mimeType TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    fileData BYTEA NOT NULL,
    uploadedBy TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (uploadedBy) REFERENCES User(id)
);
```

### CacheEntry
```sql
CREATE TABLE CacheEntry (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    expiresAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);
```

## API Changes

### Media Endpoints

#### Upload File
```bash
POST /api/v1/media/upload
Content-Type: multipart/form-data

# Form data:
# file: <binary file>
```

#### Upload Multiple Files
```bash
POST /api/v1/media/upload-multiple
Content-Type: multipart/form-data

# Form data:
# files[]: <binary file>
# files[]: <binary file>
```

#### Get File
```bash
GET /api/v1/media/:id
```

#### Get File Metadata
```bash
GET /api/v1/media/:id/metadata
```

#### Get User Files
```bash
GET /api/v1/media/user/files?page=1&limit=20&mimeType=image
```

#### Delete File
```bash
DELETE /api/v1/media/:id
```

## Benefits of PostgreSQL-Only Architecture

1. **Simplified Infrastructure**: Only need PostgreSQL database
2. **ACID Compliance**: All data operations are transactional
3. **Consistent Backups**: Single database to backup
4. **Reduced Complexity**: No need to manage Redis or S3
5. **Cost Effective**: No additional storage/cache service costs
6. **Easier Development**: Single database for all data needs

## Performance Considerations

1. **File Size Limits**: Set to 50MB per file (configurable)
2. **Cache Cleanup**: Automatic cleanup of expired cache entries every 10 minutes
3. **Media Cleanup**: Automatic cleanup of orphaned files every 24 hours
4. **Indexing**: Proper indexes on frequently queried columns

## Environment Variables

The following environment variables are no longer needed:
```bash
# REDIS_URL=redis://localhost:6379  # DISABLED
# STORAGE_ENDPOINT=https://...      # DISABLED
# STORAGE_ACCESS_KEY=...           # DISABLED
# STORAGE_SECRET_KEY=...           # DISABLED
# STORAGE_BUCKET=...               # DISABLED
# STORAGE_PUBLIC_URL=...           # DISABLED
```

## Migration Notes

1. Existing Redis data will be lost (cache data is ephemeral anyway)
2. Existing S3 files need to be migrated manually if needed
3. Update frontend code to use new media upload endpoints
4. All JWT refresh tokens and OTP codes will continue working (already in PostgreSQL)

## Monitoring

- Use `GET /api/v1/media/admin/stats` to monitor storage usage
- Monitor PostgreSQL database size and performance
- Cache statistics available through cache service