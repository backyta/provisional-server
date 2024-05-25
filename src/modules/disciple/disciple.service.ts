import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateDiscipleDto, UpdateDiscipleDto } from '@/modules/disciple/dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Repository } from 'typeorm';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { Zone } from '@/modules/zone/entities';
import { Preacher } from '@/modules/preacher/entities';
import { FamilyHouse } from '@/modules/family-house/entities';
import { MemberRoles } from '@/common/enums';
import { User } from '@/modules/user/entities';
import { Disciple } from '@/modules/disciple/entities';

@Injectable()
export class DiscipleService {
  private readonly logger = new Logger('DiscipleService');

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

    @InjectRepository(FamilyHouse)
    private readonly familyHouseRepository: Repository<FamilyHouse>,

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,
  ) {}

  //* CREATE DISCIPLE
  async create(
    createDiscipleDto: CreateDiscipleDto,
    user: User,
  ): Promise<Disciple> {
    const { roles, theirFamilyHouse } = createDiscipleDto;

    // Validations
    if (!roles.includes(MemberRoles.Disciple)) {
      throw new BadRequestException(`El rol "disciple" debe ser incluido`);
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Preacher) ||
      roles.includes(MemberRoles.Supervisor) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Disciple solo se debe tener los roles "discípulo"`,
      );
    }

    //? Validate and assign Family House
    const familyHouse = await this.familyHouseRepository.findOne({
      where: { id: theirFamilyHouse },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirZone',
        'theirPreacher',
        'disciples',
      ],
    });

    if (!familyHouse) {
      throw new NotFoundException(
        `Not found family house with id ${theirFamilyHouse}`,
      );
    }

    if (!familyHouse.status) {
      throw new BadRequestException(
        `The property status in Family House must be a "Active"`,
      );
    }

    //* Validate and assign preacher according family house
    if (!familyHouse.theirPreacher) {
      throw new NotFoundException(
        `Preacher was not found, verify that Family House has a Preacher assigned`,
      );
    }

    const preacher = await this.preacherRepository.findOne({
      where: { id: familyHouse.theirPreacher.id },
      relations: ['disciples'],
    });

    if (!preacher.status) {
      throw new BadRequestException(
        `The property status in Preacher must be "Active"`,
      );
    }

    //* Validate and assign zone according family house
    if (!familyHouse.theirZone) {
      throw new NotFoundException(
        `Zone was not found, verify that Family House has a Zone assigned`,
      );
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: familyHouse.theirZone.id },
      relations: ['disciples'],
    });

    if (!zone.status) {
      throw new BadRequestException(
        `The property status in Zone must be "Active"`,
      );
    }

    //* Validate and assign supervisor according family house
    if (!familyHouse.theirSupervisor) {
      throw new NotFoundException(
        `Supervisor was not found, verify that Family House has a Supervisor assigned`,
      );
    }

    const supervisor = await this.supervisorRepository.findOne({
      where: { id: familyHouse.theirSupervisor.id },
      relations: ['disciples'],
    });

    if (!supervisor.status) {
      throw new BadRequestException(
        `The property status in Supervisor must be "Active"`,
      );
    }

    //* Validate and assign copastor according family house
    if (!familyHouse.theirCopastor) {
      throw new NotFoundException(
        `Copastor was not found, verify that Family House has a Copastor assigned`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: familyHouse.theirCopastor.id },
      relations: ['disciples'],
    });

    if (!copastor.status) {
      throw new BadRequestException(
        `The property status in Copastor must be "Active"`,
      );
    }

    //* Validate and assign pastor according family house
    if (!familyHouse.theirPastor) {
      throw new NotFoundException(
        `Pastor was not found, verify that Family House has a Pastor assigned`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: familyHouse.theirPastor.id },
      relations: ['disciples'],
    });

    if (!pastor.status) {
      throw new BadRequestException(
        `The property status in Pastor must be "Active"`,
      );
    }

    //* Validate and assign church according family house
    if (!familyHouse.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Family House has a Church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: familyHouse.theirChurch.id },
      relations: ['disciples'],
    });

    if (!church.status) {
      throw new BadRequestException(
        `The property status in Church must be "Active"`,
      );
    }

    // Create new instance
    if (roles.includes(MemberRoles.Disciple)) {
      try {
        const newDisciple = this.discipleRepository.create({
          ...createDiscipleDto,
          theirChurch: church,
          theirPastor: pastor,
          theirCopastor: copastor,
          theirSupervisor: supervisor,
          theirZone: zone,
          theirPreacher: preacher,
          theirFamilyHouse: familyHouse,
          createdAt: new Date(),
          createdBy: user,
        });

        console.log('xd');
        const savedDisciple = await this.discipleRepository.save(newDisciple);

        // Count and assign preachers in Family House
        familyHouse.disciples = [
          ...(familyHouse.disciples || []),
          savedDisciple,
        ];
        familyHouse.numberDisciples += 1;

        // Count and assign disciples in Preacher
        preacher.disciples = [...(preacher.disciples || []), savedDisciple];
        preacher.numberDisciples += 1;

        // Count and assign preachers in Zone
        zone.disciples = [...(zone.disciples || []), savedDisciple];
        zone.numberDisciples += 1;

        // Count and assign preachers in Supervisor
        supervisor.disciples = [...(supervisor.disciples || []), savedDisciple];
        supervisor.numberDisciples += 1;

        // Count and assign preachers in Copastor
        copastor.disciples = [...(copastor.disciples || []), savedDisciple];
        copastor.numberDisciples += 1;

        // Count and assign preachers in Pastor
        pastor.disciples = [...(pastor.disciples || []), savedDisciple];
        pastor.numberDisciples += 1;

        // Count and assign preachers in Church
        church.disciples = [...(church.disciples || []), savedDisciple];
        church.numberDisciples += 1;

        await this.familyHouseRepository.save(familyHouse);
        await this.preacherRepository.save(preacher);
        await this.zoneRepository.save(zone);
        await this.supervisorRepository.save(supervisor);
        await this.copastorRepository.save(copastor);
        await this.pastorRepository.save(pastor);
        await this.churchRepository.save(church);

        return newDisciple;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  findAll() {
    return `This action returns all disciple`;
  }

  findOne(id: number) {
    return `This action returns a #${id} disciple`;
  }

  update(id: number, updateDiscipleDto: UpdateDiscipleDto) {
    return `This action updates a #${id} disciple`;
  }

  remove(id: number) {
    return `This action removes a #${id} disciple`;
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
