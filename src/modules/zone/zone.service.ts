import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateZoneDto, UpdateZoneDto } from '@/modules/zone/dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Zone } from '@/modules/zone/entities';
import { Church } from '@/modules/church/entities';
import { User } from '@/modules/user/entities';

@Injectable()
export class ZoneService {
  private readonly logger = new Logger('ZoneService');

  constructor(
    @InjectRepository(Copastor)
    private readonly copastorRepository: Repository<Copastor>,

    @InjectRepository(Supervisor)
    private readonly supervisorRepository: Repository<Supervisor>,

    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,

    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,

    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,
  ) {}

  //* CREATE ZONE
  async create(createZoneDto: CreateZoneDto, user: User): Promise<Zone> {
    const { theirSupervisor } = createZoneDto;

    //? Validate and assign supervisor
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: theirSupervisor },
      relations: ['theirZone', 'theirCopastor', 'theirPastor', 'theirChurch'],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Not found preacher with id ${theirSupervisor}`,
      );
    }

    if (!supervisor.status) {
      throw new BadRequestException(
        `The property status in Supervisor must be a "Active"`,
      );
    }

    //* Validate and assign copastor according supervisor
    if (!supervisor.theirCopastor) {
      throw new NotFoundException(
        `Copastor was not found, verify that Supervisor has a co-pastor assigned`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: supervisor.theirCopastor.id },
      relations: ['zones'],
    });

    if (!copastor.status) {
      throw new BadRequestException(
        `The property status in Copastor must be a "Active"`,
      );
    }

    //* Validate and assign pastor according supervisor
    if (!supervisor.theirPastor) {
      throw new NotFoundException(
        `Pastor was not found, verify that Supervisor has a co-pastor assigned`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: supervisor.theirPastor.id },
      relations: ['zones'],
    });

    if (!pastor.status) {
      throw new BadRequestException(
        `The property status in Pastor must be a "Active"`,
      );
    }

    //* Validate and assign church according supervisor
    if (!supervisor.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Supervisor has a church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: supervisor.theirChurch.id },
      relations: ['zones'],
    });

    if (!church.status) {
      throw new BadRequestException(
        `The property status in Church must be a "Active"`,
      );
    }

    // Create new instance
    try {
      const newZone = this.zoneRepository.create({
        ...createZoneDto,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirSupervisor: supervisor,
        createdAt: new Date(),
        createdBy: user,
      });

      const savedZone = await this.zoneRepository.save(newZone);

      // Count and assign zone in Supervisor
      supervisor.theirZone = savedZone;
      supervisor.numberZones += 1;

      // Count and assign zones in Copastor
      copastor.zones = [...(copastor.zones || []), savedZone];
      copastor.numberZones += 1;

      // Count and assign zones in Pastor
      pastor.zones = [...(pastor.zones || []), savedZone];
      pastor.numberZones += 1;

      // Count and assign zones in Church
      church.zones = [...(church.zones || []), savedZone];
      church.numberZones += 1;

      await this.supervisorRepository.save(supervisor);
      await this.copastorRepository.save(copastor);
      await this.pastorRepository.save(pastor);
      await this.churchRepository.save(church);

      return savedZone;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  findAll() {
    return `This action returns all zone`;
  }

  findOne(id: number) {
    return `This action returns a #${id} zone`;
  }

  update(id: number, updateZoneDto: UpdateZoneDto) {
    return `This action updates a #${id} zone`;
  }

  remove(id: number) {
    return `This action removes a #${id} zone`;
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
