import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberRoles } from '@/common/enums';

import { CreatePreacherDto, UpdatePreacherDto } from '@/modules/preacher/dto';
import { Preacher } from '@/modules/preacher/entities';

import { Supervisor } from '@/modules/supervisor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { User } from '@/modules/user/entities';
import { Zone } from '@/modules/zone/entities';

@Injectable()
export class PreacherService {
  private readonly logger = new Logger('PreacherService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,

    @InjectRepository(Copastor)
    private readonly copastorRepository: Repository<Copastor>,

    @InjectRepository(Supervisor)
    private readonly supervisorRepository: Repository<Supervisor>,

    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,

    @InjectRepository(Preacher)
    private readonly preacherRepository: Repository<Preacher>,
  ) {}

  //* CREATE PREACHER
  async create(
    createPreacherDto: CreatePreacherDto,
    user: User,
  ): Promise<Preacher> {
    const { roles, theirSupervisor } = createPreacherDto;

    // Validations
    if (
      !roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Preacher)
    ) {
      throw new BadRequestException(
        `El rol "disciple" y "preacher" debe ser incluido`,
      );
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Supervisor) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Preacher solo se debe tener los roles "discípulo" y "preacher"`,
      );
    }

    //? Validate and assign supervisor
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: theirSupervisor },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirZone',
        'preachers',
      ],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Not found supervisor with id ${theirSupervisor}`,
      );
    }

    if (!supervisor.status) {
      throw new BadRequestException(
        `The property status in Supervisor must be a "Active"`,
      );
    }

    //* Validate and assign zone according supervisor
    if (!supervisor.theirZone) {
      throw new NotFoundException(
        `Copastor was not found, verify that Supervisor has a copastor assigned`,
      );
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: supervisor.theirZone.id },
      relations: ['preachers'],
    });

    if (!zone.status) {
      throw new BadRequestException(
        `The property status in Zone must be "Active"`,
      );
    }

    //* Validate and assign copastor according supervisor
    if (!supervisor.theirCopastor) {
      throw new NotFoundException(
        `Copastor was not found, verify that Supervisor has a copastor assigned`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: supervisor.theirCopastor.id },
      relations: ['preachers'],
    });

    if (!copastor.status) {
      throw new BadRequestException(
        `The property status in Copastor must be "Active"`,
      );
    }

    //* Validate and assign pastor according supervisor
    if (!supervisor.theirPastor) {
      throw new NotFoundException(
        `Pastor was not found, verify that Supervisor has a pastor assigned`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: supervisor.theirPastor.id },
      relations: ['preachers'],
    });

    if (!pastor.status) {
      throw new BadRequestException(
        `The property status in Pastor must be "Active"`,
      );
    }

    //* Validate and assign church according supervisor
    if (!supervisor.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Copastor has a church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: supervisor.theirChurch.id },
      relations: ['preachers'],
    });

    if (!church.status) {
      throw new BadRequestException(
        `The property status in Church must be "Active"`,
      );
    }

    // Create new instance
    if (
      roles.includes(MemberRoles.Preacher) &&
      roles.includes(MemberRoles.Disciple)
    ) {
      try {
        const newPreacher = this.preacherRepository.create({
          ...createPreacherDto,
          theirChurch: church,
          theirPastor: pastor,
          theirCopastor: copastor,
          theirSupervisor: supervisor,
          theirZone: zone,
          createdAt: new Date(),
          createdBy: user,
        });

        const savedPreacher = await this.preacherRepository.save(newPreacher);

        // Count and assign preachers in Zone
        zone.preachers = [...(zone.preachers || []), savedPreacher];
        zone.numberPreachers += 1;

        // Count and assign preachers in Supervisor
        supervisor.preachers = [...(supervisor.preachers || []), savedPreacher];
        supervisor.numberPreachers += 1;

        // Count and assign preachers in Copastor
        copastor.preachers = [...(copastor.preachers || []), savedPreacher];
        copastor.numberPreachers += 1;

        // Count and assign preachers in Pastor
        pastor.preachers = [...(pastor.preachers || []), savedPreacher];
        pastor.numberPreachers += 1;

        // Count and assign preachers in Church
        church.preachers = [...(church.preachers || []), savedPreacher];
        church.numberPreachers += 1;

        await this.zoneRepository.save(zone);
        await this.supervisorRepository.save(supervisor);
        await this.copastorRepository.save(copastor);
        await this.pastorRepository.save(pastor);
        await this.churchRepository.save(church);

        return newPreacher;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  findAll() {
    return `This action returns all preacher`;
  }

  findOne(id: number) {
    return `This action returns a #${id} preacher`;
  }

  update(id: number, updatePreacherDto: UpdatePreacherDto) {
    return `This action updates a #${id} preacher`;
  }

  remove(id: number) {
    return `This action removes a #${id} preacher`;
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
