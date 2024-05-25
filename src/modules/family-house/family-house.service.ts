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
  CreateFamilyHouseDto,
  UpdateFamilyHouseDto,
} from '@/modules/family-house/dto';
import { FamilyHouse } from '@/modules/family-house/entities';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';

@Injectable()
export class FamilyHouseService {
  private readonly logger = new Logger('FamilyHouseService');

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
  ) {}

  // TODO : continuar con el modulo de disciple
  // TODO  : ver indices y pasar a actualizar (Hacer semilla)
  //* CREATE FAMILY HOME
  async create(
    createFamilyHouseDto: CreateFamilyHouseDto,
    user: User,
  ): Promise<FamilyHouse> {
    const { theirPreacher } = createFamilyHouseDto;

    //? Find and validate Preacher
    const preacher = await this.preacherRepository.findOne({
      where: { id: theirPreacher },
      relations: [
        'theirSupervisor',
        'theirZone',
        'theirCopastor',
        'theirPastor',
        'theirChurch',
        'familyHouses',
      ],
    });

    if (!preacher) {
      throw new NotFoundException(
        `Not found preacher with id ${theirPreacher}`,
      );
    }

    if (!preacher.status) {
      throw new BadRequestException(
        `The property status in Supervisor must be a "Active"`,
      );
    }

    //* Validate and assign supervisor according preacher
    if (!preacher.theirSupervisor) {
      throw new NotFoundException(
        `Supervisor was not found, verify that Preacher has a supervisor assigned`,
      );
    }

    const supervisor = await this.supervisorRepository.findOne({
      where: { id: preacher.theirSupervisor.id },
      relations: ['familyHouses'],
    });

    if (!supervisor.status) {
      throw new BadRequestException(
        `The property status in Supervisor must be a "Active"`,
      );
    }

    //* Validate and assign zone according preacher
    if (!preacher.theirZone) {
      throw new NotFoundException(
        `Zone was not found, verify that Preacher has a zone assigned`,
      );
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: preacher.theirZone.id },
      relations: ['familyHouses'],
    });

    if (!zone.status) {
      throw new BadRequestException(
        `The property status in Zone must be a "Active"`,
      );
    }

    //* Validate and assign copastor according preacher
    if (!preacher.theirCopastor) {
      throw new NotFoundException(
        `Copastor was not found, verify that Preacher has a co-pastor assigned`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: preacher.theirCopastor.id },
      relations: ['familyHouses'],
    });

    if (!copastor.status) {
      throw new BadRequestException(
        `The property status in Copastor must be a "Active"`,
      );
    }

    //* Validate and assign pastor according preacher
    if (!preacher.theirPastor) {
      throw new NotFoundException(
        `Pastor was not found, verify that Preacher has a pastor assigned`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: preacher.theirPastor.id },
      relations: ['familyHouses'],
    });

    if (!pastor.status) {
      throw new BadRequestException(
        `The property status in Pastor must be a "Active"`,
      );
    }

    //* Validate and assign church according preacher
    if (!preacher.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Preacher has a church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: preacher.theirChurch.id },
      relations: ['familyHouses'],
    });

    if (!church.status) {
      throw new BadRequestException(
        `The property status in Church must be a "Active"`,
      );
    }

    //? Asignación de numero y código a la casa familiar
    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirZone'],
    });
    const allFamilyHousesByZone = allFamilyHouses.filter(
      (house) => house.theirZone?.id === zone?.id,
    );

    let houseNumber: number;
    let codeHouse: string;

    if (allFamilyHousesByZone.length === 0) {
      houseNumber = 1;
      codeHouse = `${zone.zoneName.toUpperCase()}-${houseNumber}`;
    }

    if (allFamilyHousesByZone.length !== 0) {
      houseNumber = allFamilyHousesByZone.length + 1;
      codeHouse = `${zone.zoneName.toUpperCase()}-${houseNumber}`;
    }

    // Create new instance
    try {
      const newFamilyHouse = this.familyHouseRepository.create({
        ...createFamilyHouseDto,
        houseNumber: houseNumber.toString(),
        codeHouse: codeHouse,
        theirChurch: church,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirSupervisor: supervisor,
        theirPreacher: preacher,
        theirZone: zone,
        createdAt: new Date(),
        createdBy: user,
      });

      const savedFamilyHouse =
        await this.familyHouseRepository.save(newFamilyHouse);

      // Count and assign family houses in Zone
      zone.familyHouses = [...(zone.familyHouses || []), savedFamilyHouse];
      zone.numberFamilyHouses += 1;

      // Count and assign family houses in Supervisor
      supervisor.familyHouses = [
        ...(supervisor.familyHouses || []),
        savedFamilyHouse,
      ];
      supervisor.numberFamilyHouses += 1;

      // Count and assign family houses in Preacher
      preacher.familyHouses = [
        ...(preacher.familyHouses || []),
        savedFamilyHouse,
      ];
      preacher.numberFamilyHouses += 1;

      // Count and assign family houses in Copastor
      copastor.familyHouses = [
        ...(copastor.familyHouses || []),
        savedFamilyHouse,
      ];
      copastor.numberFamilyHouses += 1;

      // Count and assign family houses in Pastor
      pastor.familyHouses = [...(pastor.familyHouses || []), savedFamilyHouse];
      pastor.numberFamilyHouses += 1;

      // Count and assign family houses in Church
      church.familyHouses = [...(church.familyHouses || []), savedFamilyHouse];
      church.numberFamilyHouses += 1;

      await this.zoneRepository.save(zone);
      await this.preacherRepository.save(preacher);
      await this.supervisorRepository.save(supervisor);
      await this.copastorRepository.save(copastor);
      await this.pastorRepository.save(pastor);
      await this.churchRepository.save(church);

      return savedFamilyHouse;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  findAll() {
    return `This action returns all familyHouse`;
  }

  findOne(id: number) {
    return `This action returns a #${id} familyHouse`;
  }

  update(id: number, updateFamilyHouseDto: UpdateFamilyHouseDto) {
    return `This action updates a #${id} familyHouse`;
  }

  remove(id: number) {
    return `This action removes a #${id} familyHouse`;
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
