import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '@/modules/user/entities/';

import { CreateChurchDto, UpdateChurchDto } from '@/modules/church/dto';
import { Church } from '@/modules/church/entities';

@Injectable()
export class ChurchService {
  private readonly logger = new Logger('ChurchService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,
  ) {}

  //* CREATE CHURCH
  async create(createChurchDto: CreateChurchDto, user: User): Promise<Church> {
    const { theirMainChurch } = createChurchDto;

    //? Validate and assign main church to anexe church
    const church = await this.churchRepository.findOne({
      where: { id: theirMainChurch },
      relations: ['anexes'],
    });

    if (theirMainChurch && !church) {
      throw new NotFoundException(
        `Not found church with id ${theirMainChurch}`,
      );
    }

    if (theirMainChurch && !church.status) {
      throw new BadRequestException(
        `The property status in Church must be a "Active"`,
      );
    }

    // Create new instance
    try {
      const newChurch = this.churchRepository.create({
        ...createChurchDto,
        isAnexe: church ? true : false,
        theirMainChurch: church,
        createdAt: new Date(),
        createdBy: user,
      });

      const savedChurch = await this.churchRepository.save(newChurch);

      if (church) {
        church.anexes = [...(church.anexes || []), savedChurch];
        church.numberAnexes += 1;

        await this.churchRepository.save(church);
      }

      return newChurch;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  findAll() {
    return `This action returns all anexe`;
  }

  findOne(id: number) {
    return `This action returns a #${id} anexe`;
  }

  update(id: number, updateChurchDto: UpdateChurchDto) {
    return `This action updates a #${id} anexe`;
  }

  remove(id: number) {
    return `This action removes a #${id} anexe`;
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    console.log(error);

    throw new InternalServerErrorException(
      'Unexpected errors, check server logs',
    );
  }
}
