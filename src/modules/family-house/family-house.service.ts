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
import { isUUID } from 'class-validator';
import { Status } from '@/common/enums';
import { Disciple } from '@/modules/disciple/entities/';
import { PaginationDto } from '@/common/dtos';

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

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,
  ) {}

  //* CREATE FAMILY HOME
  async create(
    createFamilyHouseDto: CreateFamilyHouseDto,
    user: User,
  ): Promise<FamilyHouse> {
    const { theirPreacher, theirZone } = createFamilyHouseDto;

    //? Find and validate Zone
    if (!theirZone) {
      throw new NotFoundException(
        `Para crear una nueva casa familiar coloque una zona-id existente`,
      );
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: theirZone },
      relations: [
        'theirSupervisor',
        'theirCopastor',
        'theirPastor',
        'theirChurch',
      ],
    });

    if (!zone) {
      throw new NotFoundException(`Not found zone with id ${theirZone}`);
    }

    if (!zone.status) {
      throw new BadRequestException(
        `The property status in Supervisor must be a "Active"`,
      );
    }

    //? Find and validate Preacher
    if (!theirPreacher) {
      throw new NotFoundException(
        `Para crear una nueva casa familiar coloque un preacher id existente`,
      );
    }

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

    // NOTE : cuando se cambie de supervisor en zona, afecta al preacher según la zona, a las casas y los miembros, pasara
    // NOTE : a tener un nuevo supervisor y roles superiores pero la misma zona

    // NOTE : si cambio de super en preacher, cambia en todos sus subordinados, su super, zona, copastor etc
    // NOTE : tmb se cambia a sus casas y sus miembros su super zona, super, copastor etc, osea se cambia todo, todo pasa al nuevo supervisor.
    // NOTE : el problema esta que al pasar de zona se debe cambiar su numero. (ver)
    //! Relations between preacher and zone must be same
    if (zone.theirSupervisor.id !== preacher.theirSupervisor.id) {
      throw new BadRequestException(
        `El supervisor de la zona y del predicador deben ser el mismo`,
      );
    }

    if (zone.theirCopastor.id !== preacher.theirCopastor.id) {
      throw new BadRequestException(
        `El co-pastor de la zona y del predicador deben ser el mismo`,
      );
    }

    if (zone.theirPastor.id !== preacher.theirPastor.id) {
      throw new BadRequestException(
        `El pastor de la zona y del predicador deben ser el mismo`,
      );
    }

    //? Validación y asignación de los demás roles a la casa familiar
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
    let zoneName: string;

    if (allFamilyHousesByZone.length === 0) {
      houseNumber = 1;
      codeHouse = `${zone.zoneName.toUpperCase()}-${houseNumber}`;
      zoneName = zone.zoneName;
    }

    if (allFamilyHousesByZone.length !== 0) {
      houseNumber = allFamilyHousesByZone.length + 1;
      codeHouse = `${zone.zoneName.toUpperCase()}-${houseNumber}`;
      zoneName = zone.zoneName;
    }

    // TODO : se debe colocar la zone Name sacar del zone en update
    // Create new instance
    try {
      const newFamilyHouse = this.familyHouseRepository.create({
        ...createFamilyHouseDto,
        houseNumber: houseNumber.toString(),
        zoneName: zoneName,
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

      return await this.familyHouseRepository.save(newFamilyHouse);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<FamilyHouse[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.familyHouseRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirPreacher',
        'theirZone',
        'theirSupervisor',
        'theirPastor',
        'theirCopastor',
        'theirChurch',
        'disciples',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} familyHouse`;
  }

  //* UPDATE FAMILY HOUSE
  async update(
    id: string,
    updateFamilyHouseDto: UpdateFamilyHouseDto,
    user: User,
  ): Promise<FamilyHouse> {
    const { status, theirPreacher, theirZone } = updateFamilyHouseDto;

    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    // validation zone
    const familyHouse = await this.familyHouseRepository.findOne({
      where: { id: id },
      relations: [
        'theirPreacher',
        'theirZone',
        'theirSupervisor',
        'theirCopastor',
        'theirPastor',
        'theirChurch',
      ],
    });

    if (!familyHouse) {
      throw new NotFoundException(`Family House not found with id: ${id}`);
    }

    if (familyHouse.status === Status.Active && status === Status.Inactive) {
      throw new BadRequestException(
        `You cannot update it to "inactive", you must delete the record`,
      );
    }

    //? Update if their Preacher and their Zone is different
    if (
      familyHouse.theirZone.id !== theirZone &&
      familyHouse.theirPreacher.id !== theirPreacher
    ) {
      //* Find and validate Zone
      if (!theirZone) {
        throw new NotFoundException(
          `Para crear una nueva casa familiar coloque una zona-id existente`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: theirZone },
        relations: [
          'theirSupervisor',
          'theirCopastor',
          'theirPastor',
          'theirChurch',
        ],
      });

      if (!newZone) {
        throw new NotFoundException(`Not found zone with id ${theirZone}`);
      }

      if (!newZone.status) {
        throw new BadRequestException(
          `The property status in Supervisor must be a "Active"`,
        );
      }

      //* Find and validate Preacher
      if (!theirPreacher) {
        throw new NotFoundException(
          `Para crear una nueva casa familiar coloque un preacher id existente`,
        );
      }

      const newPreacher = await this.preacherRepository.findOne({
        where: { id: theirPreacher },
        relations: [
          'theirSupervisor',
          'theirZone',
          'theirCopastor',
          'theirPastor',
          'theirChurch',
        ],
      });

      if (!newPreacher) {
        throw new NotFoundException(
          `Not found preacher with id ${theirPreacher}`,
        );
      }

      if (!newPreacher.status) {
        throw new BadRequestException(
          `The property status in Supervisor must be a "Active"`,
        );
      }

      //! Relations between preacher and zone must be same
      if (newZone.theirSupervisor.id !== newPreacher.theirSupervisor.id) {
        throw new BadRequestException(
          `El supervisor de la zona y del predicador deben ser el mismo`,
        );
      }

      if (newZone.theirCopastor.id !== newPreacher.theirCopastor.id) {
        throw new BadRequestException(
          `El co-pastor de la zona y del predicador deben ser el mismo`,
        );
      }

      if (newZone.theirPastor.id !== newPreacher.theirPastor.id) {
        throw new BadRequestException(
          `El pastor de la zona y del predicador deben ser el mismo`,
        );
      }

      //? Validación y asignación de los demás roles a la casa familiar
      //* Validate and assign supervisor according preacher
      if (!newPreacher.theirSupervisor) {
        throw new NotFoundException(
          `Supervisor was not found, verify that Preacher has a supervisor assigned`,
        );
      }

      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: newPreacher.theirSupervisor.id },
        relations: ['familyHouses'],
      });

      if (!newSupervisor.status) {
        throw new BadRequestException(
          `The property status in Supervisor must be a "Active"`,
        );
      }

      //* Validate and assign copastor according preacher
      if (!newPreacher.theirCopastor) {
        throw new NotFoundException(
          `Copastor was not found, verify that Preacher has a co-pastor assigned`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newPreacher.theirCopastor.id },
        relations: ['familyHouses'],
      });

      if (!newCopastor.status) {
        throw new BadRequestException(
          `The property status in Copastor must be a "Active"`,
        );
      }

      //* Validate and assign pastor according preacher
      if (!newPreacher.theirPastor) {
        throw new NotFoundException(
          `Pastor was not found, verify that Preacher has a pastor assigned`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newPreacher.theirPastor.id },
        relations: ['familyHouses'],
      });

      if (!newPastor.status) {
        throw new BadRequestException(
          `The property status in Pastor must be a "Active"`,
        );
      }

      //* Validate and assign church according preacher
      if (!newPreacher.theirChurch) {
        throw new NotFoundException(
          `Church was not found, verify that Preacher has a church assigned`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newPreacher.theirChurch.id },
        relations: ['familyHouses'],
      });

      if (!newChurch.status) {
        throw new BadRequestException(
          `The property status in Church must be a "Active"`,
        );
      }

      //? Asignación de numero y código a la casa familiar
      const allFamilyHouses = await this.familyHouseRepository.find({
        relations: ['theirZone'],
      });
      const allFamilyHousesByZone = allFamilyHouses.filter(
        (house) => house.theirZone?.id === newZone?.id,
      );

      let houseNumber: number;
      let codeHouse: string;

      if (allFamilyHousesByZone.length === 0) {
        houseNumber = 1;
        codeHouse = `${newZone.zoneName.toUpperCase()}-${houseNumber}`;
      }

      if (allFamilyHousesByZone.length !== 0) {
        houseNumber = allFamilyHousesByZone.length + 1;
        codeHouse = `${newZone.zoneName.toUpperCase()}-${houseNumber}`;
      }

      //? All members by module
      const allDisciples = await this.discipleRepository.find({
        relations: [
          'theirSupervisor',
          'theirZone',
          'theirPastor',
          'theirCopastor',
          'theirChurch',
        ],
      });

      //* Update in all disciples the new relations of the family House that is updated.
      const disciplesByFamilyHouse = allDisciples.filter(
        (disciple) => disciple.theirFamilyHouse?.id === familyHouse?.id,
      );

      const updateDisciples = disciplesByFamilyHouse.map(async (disciple) => {
        await this.discipleRepository.update(disciple.id, {
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newPreacher,
          theirZone: newZone,
          theirPreacher: newPreacher,
        });
      });

      // Update and save
      const updatedFamilyHouse = await this.familyHouseRepository.preload({
        id: familyHouse.id,
        ...updateFamilyHouseDto,
        houseNumber: houseNumber.toString(),
        codeHouse: codeHouse,
        theirChurch: newChurch,
        theirPastor: newPastor,
        theirCopastor: newCopastor,
        theirSupervisor: newSupervisor,
        theirZone: newZone,
        theirPreacher: newPreacher,
        updatedAt: new Date(),
        updatedBy: user,
        status: status,
      });

      try {
        await Promise.all(updateDisciples);

        return await this.familyHouseRepository.save(updatedFamilyHouse);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update if their Preacher is different and their Zone is same
    if (
      familyHouse.theirZone.id === theirZone &&
      familyHouse.theirPreacher.id !== theirPreacher
    ) {
      //* Find and validate Preacher
      if (!theirPreacher) {
        throw new NotFoundException(
          `Para crear una nueva casa familiar coloque un preacher id existente`,
        );
      }

      const newPreacher = await this.preacherRepository.findOne({
        where: { id: theirPreacher },
        relations: [
          'theirSupervisor',
          'theirZone',
          'theirCopastor',
          'theirPastor',
          'theirChurch',
        ],
      });

      if (!newPreacher) {
        throw new NotFoundException(
          `Not found preacher with id ${theirPreacher}`,
        );
      }

      if (!newPreacher.status) {
        throw new BadRequestException(
          `The property status in Supervisor must be a "Active"`,
        );
      }

      //! Relations between preacher and zone must be same
      if (
        familyHouse.theirZone.theirSupervisor.id !==
        newPreacher.theirSupervisor.id
      ) {
        throw new BadRequestException(
          `El supervisor de la zona y del predicador deben ser el mismo`,
        );
      }

      if (
        familyHouse.theirZone.theirCopastor.id !== newPreacher.theirCopastor.id
      ) {
        throw new BadRequestException(
          `El co-pastor de la zona y del predicador deben ser el mismo`,
        );
      }

      if (familyHouse.theirZone.theirPastor.id !== newPreacher.theirPastor.id) {
        throw new BadRequestException(
          `El pastor de la zona y del predicador deben ser el mismo`,
        );
      }

      //? All members by module
      const allDisciples = await this.discipleRepository.find({
        relations: [
          'theirSupervisor',
          'theirZone',
          'theirPastor',
          'theirCopastor',
          'theirChurch',
        ],
      });

      //* Update in all disciples the new relations of the family House that is updated.
      const disciplesByFamilyHouse = allDisciples.filter(
        (disciple) => disciple.theirFamilyHouse?.id === familyHouse?.id,
      );

      const updateDisciples = disciplesByFamilyHouse.map(async (disciple) => {
        await this.discipleRepository.update(disciple.id, {
          theirPreacher: newPreacher,
        });
      });

      // Update and save
      const updatedFamilyHouse = await this.familyHouseRepository.preload({
        id: familyHouse.id,
        ...updateFamilyHouseDto,
        theirChurch: familyHouse.theirChurch,
        theirPastor: familyHouse.theirPastor,
        theirCopastor: familyHouse.theirCopastor,
        theirSupervisor: familyHouse.theirSupervisor,
        theirZone: familyHouse.theirPreacher,
        theirPreacher: newPreacher,
        updatedAt: new Date(),
        updatedBy: user,
        status: status,
      });

      try {
        await Promise.all(updateDisciples);

        return await this.familyHouseRepository.save(updatedFamilyHouse);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is same Preacher and Zone
    const updatedFamilyHouse = await this.familyHouseRepository.preload({
      id: familyHouse.id,
      ...updateFamilyHouseDto,
      theirChurch: familyHouse.theirChurch,
      theirPastor: familyHouse.theirPastor,
      theirCopastor: familyHouse.theirCopastor,
      theirSupervisor: familyHouse.theirSupervisor,
      theirZone: familyHouse.theirZone,
      theirPreacher: familyHouse.theirPreacher,
      updatedAt: new Date(),
      updatedBy: user,
      status: status,
    });

    try {
      return await this.familyHouseRepository.save(updatedFamilyHouse);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //! DELETE FAMILY HOUSE
  async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const familyHouse = await this.familyHouseRepository.findOneBy({ id });

    if (!familyHouse) {
      throw new NotFoundException(`Family House with id: ${id} not exits`);
    }

    //* Update and set in Inactive on Family House
    const updatedFamilyHouse = await this.familyHouseRepository.preload({
      id: familyHouse.id,
      theirChurch: null,
      theirPastor: null,
      theirCopastor: null,
      theirSupervisor: null,
      theirZone: null,
      theirPreacher: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    // Update and set to null relationships in Disciple, all those (who have the same Zone).
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirFamilyHouse'],
    });

    const disciplesByFamilyHouse = allDisciples.filter(
      (disciple) => disciple.theirFamilyHouse?.id === familyHouse?.id,
    );

    const deleteFamilyHouseInDisciple = disciplesByFamilyHouse.map(
      async (disciple) => {
        await this.discipleRepository.update(disciple?.id, {
          theirFamilyHouse: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and save
    try {
      await Promise.all(deleteFamilyHouseInDisciple);

      await this.zoneRepository.save(updatedFamilyHouse);
    } catch (error) {
      this.handleDBExceptions(error);
    }
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
