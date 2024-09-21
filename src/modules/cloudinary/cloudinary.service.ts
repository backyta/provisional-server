/* eslint-disable @typescript-eslint/no-var-requires */

import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Raw, Repository } from 'typeorm';

import * as streamifier from 'streamifier';
import { v2 as cloudinary } from 'cloudinary';
import { InjectRepository } from '@nestjs/typeorm';

import { OfferingFileType } from '@/common/enums';

import { User } from '@/modules/user/entities';
import { CloudinaryResponse } from '@/modules/cloudinary/types';
import { CreateFileDto, DeleteFileDto } from '@/modules/files/dto';

import { OfferingIncome } from '@/modules/offering/income/entities';
import { OfferingExpense } from '@/modules/offering/expense/entities';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger('CloudinaryService');

  constructor(
    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    @InjectRepository(OfferingExpense)
    private readonly offeringExpenseRepository: Repository<OfferingExpense>,
  ) {}

  //* Upload files
  uploadFile(
    file: Express.Multer.File,
    createFileDto: CreateFileDto,
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const { fileType, type, subType } = createFileDto;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: subType
            ? `${fileType}/${type}/${subType}`
            : `${fileType}/${type}`,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  //! Delete file
  async deleteFile(
    publicId: string,
    deleteFileDto: DeleteFileDto,
    user: User,
  ): Promise<void> {
    const { fileType, path, secureUrl } = deleteFileDto;

    //? Validation if income or expense
    //* Income
    if (fileType === OfferingFileType.Income) {
      try {
        const offeringIncome = await this.offeringIncomeRepository.findOne({
          where: {
            imageUrls: Raw((alias) => `:secureUrl = ANY(${alias})`, {
              secureUrl: secureUrl,
            }),
          },
          relations: [
            'church',
            'zone',
            'familyGroup',
            'pastor',
            'copastor',
            'supervisor',
            'preacher',
            'disciple',
          ],
        });

        if (!offeringIncome) {
          throw new NotFoundException(
            `Registro de Ingreso de Ofrenda no fue encontrado.`,
          );
        }

        const newSecureUrls = offeringIncome.imageUrls.filter(
          (imageUrl) => imageUrl !== secureUrl,
        );

        const updatedOfferingIncome =
          await this.offeringIncomeRepository.preload({
            id: offeringIncome?.id,
            ...offeringIncome,
            imageUrls: [...newSecureUrls],
            updatedAt: new Date(),
            updatedBy: user,
          });

        await this.offeringIncomeRepository.save(updatedOfferingIncome);

        const result = await cloudinary.uploader.destroy(`${path}${publicId}`);

        if (result.result !== 'ok') {
          throw new Error(
            `Fallo borrar la imagen, Cloudinary respuesta: ${result.result}`,
          );
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleCloudServiceExceptions(error);
      }
    }

    //* Expense
    if (fileType === OfferingFileType.Expense) {
      try {
        const offeringExpense = await this.offeringExpenseRepository.findOne({
          where: {
            imageUrls: Raw((alias) => `:secureUrl = ANY(${alias})`, {
              secureUrl: secureUrl,
            }),
          },
          relations: ['church'],
        });

        if (!offeringExpense) {
          throw new NotFoundException(
            `Registro de Salida de Ofrenda no fue encontrado.`,
          );
        }

        const newSecureUrls = offeringExpense.imageUrls.filter(
          (imageUrl) => imageUrl !== secureUrl,
        );

        const updatedOfferingExpense =
          await this.offeringExpenseRepository.preload({
            id: offeringExpense?.id,
            ...offeringExpense,
            imageUrls: [...newSecureUrls],
            updatedAt: new Date(),
            updatedBy: user,
          });

        await this.offeringExpenseRepository.save(updatedOfferingExpense);

        const result = await cloudinary.uploader.destroy(
          `${deleteFileDto.path}${publicId}`,
        );

        if (result.result !== 'ok') {
          throw new Error(
            `Fallo borrar la imagen, Cloudinary respuesta: ${result.result}`,
          );
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleCloudServiceExceptions(error);
      }
    }
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleCloudServiceExceptions(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(`${error.message}`);
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador y que revise los registros de consola.',
    );
  }
}
