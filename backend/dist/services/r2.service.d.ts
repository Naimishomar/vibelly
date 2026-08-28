export declare const uploadToR2: (file: Express.Multer.File, folder: "profiles" | "ephemeral" | "groups" | "creators" | "verification" | "thumbnails" | "posts") => Promise<{
    url: string;
    s3Key: string;
}>;
/**
 * Compresses an image to JPEG at 80% quality and resizes to max 1280px
 * before uploading to R2. Uses the 'posts' folder.
 */
export declare const uploadToR2WithCompression: (file: Express.Multer.File) => Promise<{
    url: string;
    s3Key: string;
}>;
export declare const deleteFromR2: (key: string) => Promise<void>;
//# sourceMappingURL=r2.service.d.ts.map