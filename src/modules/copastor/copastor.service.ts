import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { MemberRoles } from '@/common/enums';

import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';

import { CreateCopastorDto, UpdateCopastorDto } from '@/modules/copastor/dto';
import { Copastor } from '@/modules/copastor/entities';

@Injectable()
export class CopastorService {
  private readonly logger = new Logger('CopastorService');
  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,

    @InjectRepository(Copastor)
    private readonly copastorRepository: Repository<Copastor>,
  ) {}

  //* CREATE COPASTOR
  async create(
    createCopastorDto: CreateCopastorDto,
    user: User,
  ): Promise<Copastor> {
    const { roles, theirPastor } = createCopastorDto;

    // Validations
    if (
      !roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Copastor)
    ) {
      throw new BadRequestException(
        `El rol "disciple" y "co-pastor" debe ser incluido`,
      );
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Supervisor) ||
      roles.includes(MemberRoles.Preacher) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Copastor solo se debe tener los roles "discípulo" y "co-pastor"`,
      );
    }

    //? Validate and assign pastor
    const pastor = await this.pastorRepository.findOne({
      where: { id: theirPastor },
      relations: ['theirChurch', 'copastors'],
    });

    if (!pastor) {
      throw new NotFoundException(`Not found pastor with id ${theirPastor}`);
    }

    if (!pastor.status) {
      throw new BadRequestException(
        `The property status in Pastor must be a "Active"`,
      );
    }

    //* Validate church according pastor
    if (!pastor.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Pastor has a church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: pastor.theirChurch.id },
      relations: ['copastors'],
    });

    if (!church.status) {
      throw new BadRequestException(
        `The property status in Church must be "Active"`,
      );
    }

    // Create new instance
    if (
      roles.includes(MemberRoles.Copastor) &&
      roles.includes(MemberRoles.Disciple)
    ) {
      try {
        const newCopastor = this.copastorRepository.create({
          ...createCopastorDto,
          theirPastor: pastor,
          theirChurch: church,
          createdAt: new Date(),
          createdBy: user,
        });

        const savedCopastor = await this.copastorRepository.save(newCopastor);

        // Count and assign copastors in Pastors
        pastor.copastors = [...(pastor.copastors || []), savedCopastor];
        pastor.numberCopastors += 1;

        // Count and assign copastors in Church
        church.copastors = [...(church.copastors || []), savedCopastor];
        church.numberCopastors += 1;

        await this.pastorRepository.save(pastor);
        await this.churchRepository.save(church);

        return newCopastor;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  findAll() {
    return `This action returns all copastor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} copastor`;
  }

  update(id: number, updateCopastorDto: UpdateCopastorDto) {
    return `This action updates a #${id} copastor`;
  }

  remove(id: number) {
    return `This action removes a #${id} copastor`;
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
