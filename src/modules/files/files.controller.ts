import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseFilePipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

import { Auth } from '@/modules/auth/decorators';
import { UserRoles } from '@/modules/auth/enums';

import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

// NOTE : Al subir als imágenes se llama este endpoint, se obtienen la secure_url en un array de las imágenes y se
// NOTE : ponen al objeto del formulario en secure urls , que sera enviado al backend para guardar

@Controller('files')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized Bearer Auth.',
})
@ApiInternalServerErrorResponse({
  description: 'Internal server error, check logs.',
})
@ApiBadRequestResponse({
  description: 'Bad request.',
})
export class FilesController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  //* Upload file to cloudinary
  @Post('upload')
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser, UserRoles.TreasurerUser)
  @ApiCreatedResponse({
    description: 'Offering file has been successfully uploaded.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  async uploadImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 4 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    if (files.length > 4) {
      throw new BadRequestException('Image limits have been exceeded (max 4).');
    }

    const uploadedFilesPromises = files.map((file) =>
      this.cloudinaryService.uploadFile(file),
    );
    const result = await Promise.all(uploadedFilesPromises);
    return result.map((res) => res.secure_url);
  }
}
