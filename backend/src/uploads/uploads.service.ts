import crypto from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

@Injectable()
export class UploadsService {
  private readonly client: S3Client;

  constructor(private readonly prisma: PrismaService) {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION;
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;

    if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
      throw new Error('S3_CONFIG_MISSING');
    }

    this.client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle:
        String(process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    });
  }

  async uploadImage(input: {
    ownerId: string;
    originalName: string;
    mime: string;
    sizeBytes: number;
    bytes: Buffer;
  }) {
    const bucket = process.env.S3_BUCKET;
    const publicBase = process.env.S3_PUBLIC_BASE_URL;
    if (!bucket || !publicBase) throw new Error('S3_BUCKET_MISSING');

    const id = crypto.randomBytes(10).toString('hex');
    const name = safeName(input.originalName || 'image');
    const key = `uploads/${input.ownerId}/${id}_${name}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: input.bytes,
        ContentType: input.mime,
      }),
    );

    const url = `${publicBase.replace(/\/$/, '')}/${bucket}/${key}`;
    const upload = await this.prisma.upload.create({
      data: {
        ownerId: input.ownerId,
        url,
        key,
        bucket,
        mime: input.mime,
        sizeBytes: input.sizeBytes,
      },
      select: { id: true, url: true },
    });

    return upload;
  }
}
