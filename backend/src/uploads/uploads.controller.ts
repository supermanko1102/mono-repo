import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { UploadsService } from './uploads.service';

@Controller('api/uploads')
export class UploadsController {
  constructor(
    private readonly auth: AuthService,
    private readonly uploads: UploadsService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async upload(
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const me = await this.auth.requireUser(req).catch(() => null);
    if (!me) return { ok: false, error: 'Unauthorized' };
    if (!file) return { ok: false, error: 'Missing file' };
    if (!file.mimetype.startsWith('image/'))
      return { ok: false, error: 'Only image uploads supported' };

    try {
      const upload = await this.uploads.uploadImage({
        ownerId: me.id,
        originalName: file.originalname,
        mime: file.mimetype,
        sizeBytes: file.size,
        bytes: file.buffer,
      });

      return { ok: true, data: { uploadId: upload.id, path: upload.url } };
    } catch {
      return { ok: false, error: 'Upload failed' };
    }
  }
}
