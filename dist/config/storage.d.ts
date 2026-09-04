import { S3Client } from '@aws-sdk/client-s3';
export declare const storageBucket: string;
export declare const storagePublicUrl: string;
export declare const r2: S3Client;
export declare function verifyR2Access(): Promise<void>;
//# sourceMappingURL=storage.d.ts.map