import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, Repository } from 'typeorm';

import { PaginationDto } from '@/common/dtos';

import {
  CreateExternalDonorDto,
  UpdateExternalDonorDto,
} from '@/modules/external-donor/dto';
import { ExternalDonor } from '@/modules/external-donor/entities';

@Injectable()
export class ExternalDonorService {
  private readonly logger = new Logger('ExternalDonorService');

  constructor(
    @InjectRepository(ExternalDonor)
    private readonly externalDonorRepository: Repository<ExternalDonor>,
  ) {}

  create(createExternalDonorDto: CreateExternalDonorDto) {
    return 'This action adds a new externalDonator';
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { order = 'ASC' } = paginationDto;

    try {
      const externalDonors = await this.externalDonorRepository.find({
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (externalDonors.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return externalDonors;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} externalDonator`;
  }

  update(id: number, updateExternalDonorDto: UpdateExternalDonorDto) {
    return `This action updates a #${id} externalDonator`;
  }

  remove(id: number) {
    return `This action removes a #${id} externalDonator`;
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      const detail = error.detail;

      if (detail.includes('email')) {
        throw new BadRequestException('El correo electrónico ya está en uso.');
      }
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
