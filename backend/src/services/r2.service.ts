import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/env';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export const uploadToR2 = async (file: Express.Multer.File, folder: 'profiles' | 'ephemeral' | 'groups' | 'creators' | 'verification' | 'thumbnails') => {
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
