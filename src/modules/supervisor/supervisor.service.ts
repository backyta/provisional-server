import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
  CreateSupervisorDto,
  UpdateSupervisorDto,
} from '@/modules/supervisor/dto';

import { MemberRoles } from '@/common/enums';

import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';

// TODO : FALTA Enlazar a supervisor a pastores y si no hay copastores
// NOTE : los anexos tendrán casas predicadores y supervisor antes de pasarse a anexo ese pueblo, pero no habrá copastores
// NOTE : se debe enlazar supervisor directo a pastor, con una opción en el front y

@Injectable()
export class SupervisorService {
  private readonly logger = new Logger('CopastorService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,

    @InjectRepository(Copastor)
    private readonly copastorRepository: Repository<Copastor>,

    @InjectRepository(Supervisor)
    private readonly supervisorRepository: Repository<Supervisor>,
  ) {}

  //* CREATE SUPERVISOR
  async create(
    createSupervisorDto: CreateSupervisorDto,
    user: User,
  ): Promise<Supervisor> {
    const { roles, theirCopastor } = createSupervisorDto;

    // Validations
    if (
      !roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Supervisor)
    ) {
      throw new BadRequestException(
        `El rol "disciple" y "co-pastor" debe ser incluido`,
      );
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Preacher) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Supervisor solo se debe tener los roles "discípulo" y "supervisor"`,
      );
    }

    //? Validate and assign copastor
    const copastor = await this.copastorRepository.findOne({
      where: { id: theirCopastor },
      relations: ['theirPastor', 'theirChurch', 'supervisors'],
    });

    if (!copastor) {
      throw new NotFoundException(`Not found pastor with id ${theirCopastor}`);
    }

    if (!copastor.status) {
      throw new BadRequestException(
        `The property status in Copastor must be a "Active"`,
      );
    }

    //* Validate and assign pastor according copastor
    if (!copastor.theirPastor) {
      throw new NotFoundException(
        `Pastor was not found, verify that Copastor has a pastor assigned`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: copastor.theirPastor.id },
      relations: ['supervisors'],
    });

    if (!pastor.status) {
      throw new BadRequestException(
        `The property status in Pastor must be "Active"`,
      );
    }

    //* Validate and assign church according copastor
    if (!copastor.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Copastor has a church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: copastor.theirChurch.id },
      relations: ['supervisors'],
    });

    if (!church.status) {
      throw new BadRequestException(
        `The property status in Church must be "Active"`,
      );
    }

    // Create new instance
    if (
      roles.includes(MemberRoles.Supervisor) &&
      roles.includes(MemberRoles.Disciple)
    ) {
      try {
        const newSupervisor = this.supervisorRepository.create({
          ...createSupervisorDto,
          theirChurch: church,
          theirPastor: pastor,
          theirCopastor: copastor,
          createdAt: new Date(),
          createdBy: user,
        });

        const savedSupervisor =
          await this.supervisorRepository.save(newSupervisor);

        // Count and assign supervisors in Copastor
        copastor.supervisors = [
          ...(copastor.supervisors || []),
          savedSupervisor,
        ];
        copastor.numberSupervisors += 1;

        // Count and assign supervisors in Pastor
        pastor.supervisors = [...(pastor.supervisors || []), savedSupervisor];
        pastor.numberSupervisors += 1;

        // Count and assign supervisors in Church
        church.supervisors = [...(pastor.supervisors || []), savedSupervisor];
        church.numberSupervisors += 1;

        await this.copastorRepository.save(copastor);
        await this.pastorRepository.save(pastor);
        await this.churchRepository.save(church);

        return newSupervisor;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  findAll() {
    return `This action returns all supervisor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} supervisor`;
  }

  update(id: number, updateSupervisorDto: UpdateSupervisorDto) {
    return `This action updates a #${id} supervisor`;
  }

  remove(id: number) {
    return `This action removes a #${id} supervisor`;
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
