/* eslint-disable @typescript-eslint/no-var-requires */

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './types/cloudinary-response.type';
import * as streamifier from 'streamifier';
import { CreateFileDto } from '../files/dto';

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
    createFileDto: CreateFileDto,
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const { action, type, subType } = createFileDto;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${action}/${type}/${subType}`,
        },
        (error, result) => {
          console.log(error);

          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
