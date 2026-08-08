import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/env';
import sharp from 'sharp';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export const uploadToR2 = async (file: Express.Multer.File, folder: 'profiles' | 'ephemeral' | 'groups' | 'creators' | 'verification' | 'thumbnails' | 'posts') => {
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${folder}/${uuidv4()}.${fileExt}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  // Return both the public URL and the S3 Key
  return {
    url: `${process.env.R2_PUBLIC_URL}/${fileName}`,
    s3Key: fileName,
  };
};

/**
 * Compresses an image to JPEG at 80% quality and resizes to max 1280px
 * before uploading to R2. Uses the 'posts' folder.
 */
export const uploadToR2WithCompression = async (file: Express.Multer.File) => {
  const fileName = `posts/${uuidv4()}.jpg`;

  const compressed = await sharp(file.buffer)
    .rotate()                          // auto-rotate from EXIF
    .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: compressed,
    ContentType: 'image/jpeg',
  });

  await s3.send(command);

  return {
    url: `${process.env.R2_PUBLIC_URL}/${fileName}`,
    s3Key: fileName,
  };
};

export const deleteFromR2 = async (key: string) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });
    await s3.send(command);
    console.log(`[R2 Service] Successfully deleted ${key}`);
  } catch (error) {
    console.error(`[R2 Service] Failed to delete ${key}:`, error);
  }
};

