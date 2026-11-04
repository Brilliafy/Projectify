import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import util from 'util';
import { env } from '../config/env';
import { IAttachment } from '../models/task.model';

const pump = util.promisify(pipeline);

export interface IStorageService {
  uploadFile(part: { filename: string; mimetype: string; file: NodeJS.ReadableStream }): Promise<IAttachment>;
  getDownloadUrl(gcsFileName: string): Promise<string | null>;
  deleteFile(gcsFileName: string): Promise<void>;
}

class GCSStorageService implements IStorageService {
  private bucket: any;

  constructor() {
    const options: any = {
      projectId: env.GCP_PROJECT_ID,
    };

    if (env.GCS_KEY_FILE && fs.existsSync(env.GCS_KEY_FILE)) {
      options.keyFilename = env.GCS_KEY_FILE;
    }

    const storage = new Storage(options);
    this.bucket = storage.bucket(env.GCS_BUCKET_NAME);
  }

  async uploadFile(part: { filename: string; mimetype: string; file: NodeJS.ReadableStream }): Promise<IAttachment> {
    const uniqueName = `${Date.now()}-${part.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const file = this.bucket.file(uniqueName);

    const writeStream = file.createWriteStream({
      resumable: false,
      contentType: part.mimetype,
    });

    await pump(part.file, writeStream);
    const [metadata] = await file.getMetadata();

    return {
      fileName: uniqueName,
      originalName: part.filename,
      mimeType: part.mimetype,
      gcsFileName: uniqueName,
      size: Number(metadata.size) || 0,
      uploadedAt: new Date(),
    };
  }

  async getDownloadUrl(gcsFileName: string): Promise<string | null> {
    try {
      const file = this.bucket.file(gcsFileName);
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000,
      });
      return url;
    } catch (err) {
      console.warn('GCS signed URL generation warning:', err);
      return null;
    }
  }

  async deleteFile(gcsFileName: string): Promise<void> {
    try {
      await this.bucket.file(gcsFileName).delete();
    } catch (err) {
      console.warn(`GCS file delete warning (${gcsFileName}):`, err);
    }
  }
}

class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(part: { filename: string; mimetype: string; file: NodeJS.ReadableStream }): Promise<IAttachment> {
    const uniqueName = `${Date.now()}-${part.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const targetPath = path.join(this.uploadDir, uniqueName);

    const writeStream = fs.createWriteStream(targetPath);
    await pump(part.file, writeStream);

    const stats = fs.statSync(targetPath);

    return {
      fileName: uniqueName,
      originalName: part.filename,
      mimeType: part.mimetype,
      gcsFileName: uniqueName,
      size: stats.size,
      uploadedAt: new Date(),
    };
  }

  async getDownloadUrl(gcsFileName: string): Promise<string | null> {
    return `/api/tasks/attachments/${encodeURIComponent(gcsFileName)}`;
  }

  async deleteFile(gcsFileName: string): Promise<void> {
    try {
      const targetPath = path.join(this.uploadDir, gcsFileName);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
    } catch (err) {
      console.warn(`Local file delete warning (${gcsFileName}):`, err);
    }
  }

  getFilePath(gcsFileName: string): string | null {
    const targetPath = path.join(this.uploadDir, path.basename(gcsFileName));
    return fs.existsSync(targetPath) ? targetPath : null;
  }
}

function initStorage(): IStorageService {
  if (env.STORAGE_DRIVER === 'gcs') {
    try {
      return new GCSStorageService();
    } catch (err) {
      console.warn('Failed to initialize GCS storage driver. Falling back to local disk storage:', err);
      return new LocalStorageService();
    }
  }
  return new LocalStorageService();
}

export const storageService = initStorage();
