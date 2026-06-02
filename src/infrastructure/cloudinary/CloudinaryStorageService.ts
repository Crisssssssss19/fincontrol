import { IStorageService } from '@/core/services/IStorageService';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary directly from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryStorageService implements IStorageService {
  async uploadFile(fileBuffer: Buffer, fileName: string, _mimeType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', public_id: fileName.split('.')[0] },
        (error, result) => {
          if (error) return reject(error);
          resolve(result?.secure_url || '');
        }
      );
      uploadStream.end(fileBuffer);
    });
  }
}

export const storageService = new CloudinaryStorageService();
