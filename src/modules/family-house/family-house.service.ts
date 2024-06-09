import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';

import { PaginationDto } from '@/common/dtos';
import { Status } from '@/common/enums';

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
import { Disciple } from '@/modules/disciple/entities';
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
        `To create a new family house place an existing zone id`,
      );
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: theirZone },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
      ],
    });

    if (!zone) {
      throw new NotFoundException(`Not found Zone with id ${theirZone}`);
    }

    if (zone.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Zone must be a "active"`,
      );
    }

    //? Find and validate Preacher
    if (!theirPreacher) {
      throw new NotFoundException(
        `To create a new family home place an existing preacher id`,
      );
    }

    const preacher = await this.preacherRepository.findOne({
      where: { id: theirPreacher },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirZone',
      ],
    });

    if (!preacher) {
      throw new NotFoundException(
        `Not found Preacher with id ${theirPreacher}`,
      );
    }

    if (preacher.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Preacher must be a "active"`,
      );
    }

    //! Relations between preacher and zone must be same
    if (zone.theirSupervisor.id !== preacher.theirSupervisor.id) {
      throw new BadRequestException(
        `The zone supervisor and the preacher supervisor must be the same`,
      );
    }

    if (zone.theirCopastor.id !== preacher.theirCopastor.id) {
      throw new BadRequestException(
        `The zone co-pastor and the preacher's co-pastor must be the same`,
      );
    }

    if (zone.theirPastor.id !== preacher.theirPastor.id) {
      throw new BadRequestException(
        `The zone pastor and the preacher's pastor must be the same.`,
      );
    }

    if (zone.theirChurch.id !== preacher.theirChurch.id) {
      throw new BadRequestException(
        `The zone church and the preacher's church must be the same`,
      );
    }

    //? Validation and assignment of other roles to the family home
    //* Validate and assign supervisor according preacher
    if (!preacher.theirSupervisor) {
      throw new NotFoundException(
        `Supervisor was not found, verify that Preacher has a supervisor assigned`,
      );
    }

    const supervisor = await this.supervisorRepository.findOne({
      where: { id: preacher?.theirSupervisor?.id },
    });

    if (supervisor.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Supervisor must be a "active"`,
      );
    }

    //* Validate and assign copastor according preacher
    if (!preacher?.theirCopastor) {
      throw new NotFoundException(
        `Copastor was not found, verify that Preacher has a co-pastor assigned`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: preacher?.theirCopastor?.id },
    });

    if (copastor.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Copastor must be a "active"`,
      );
    }

    //* Validate and assign pastor according preacher
    if (!preacher?.theirPastor) {
      throw new NotFoundException(
        `Pastor was not found, verify that Preacher has a pastor assigned`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: preacher?.theirPastor?.id },
      relations: ['familyHouses'],
    });

    if (pastor.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Pastor must be a "active"`,
      );
    }

    //* Validate and assign church according preacher
    if (!preacher.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Preacher has a church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: preacher?.theirChurch?.id },
      relations: ['familyHouses'],
    });

    if (church.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Church must be a "active"`,
      );
    }

    //? Assignment of number and code to the family home
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

    // Create new instance
    try {
      const newFamilyHouse = this.familyHouseRepository.create({
        ...createFamilyHouseDto,
        houseNumber: houseNumber,
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

      const savedFamilyHouse =
        await this.familyHouseRepository.save(newFamilyHouse);

      preacher.theirFamilyHouse = savedFamilyHouse;

      await this.preacherRepository.save(preacher);

      return savedFamilyHouse;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    const data = await this.familyHouseRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirZone',
        'theirPreacher',
        'disciples',
      ],
      // relationLoadStrategy: 'query',
      order: { createdAt: 'ASC' },
    });

    const result = data.map((data) => ({
      ...data,
      theirChurch: {
        id: data.theirChurch?.id,
        churchName: data.theirChurch?.churchName,
      },
      theirPastor: {
        id: data.theirPastor?.id,
        firstName: data.theirPastor?.firstName,
        lastName: data.theirPastor?.lastName,
        roles: data.theirPastor?.roles,
      },
      theirCopastor: {
        id: data.theirCopastor?.id,
        firstName: data.theirCopastor?.firstName,
        lastName: data.theirCopastor?.lastName,
        roles: data.theirCopastor?.roles,
      },
      theirSupervisor: {
        id: data.theirSupervisor?.id,
        firstName: data.theirSupervisor?.firstName,
        lastName: data.theirSupervisor?.lastName,
        roles: data.theirSupervisor?.roles,
      },
      theirZone: {
        id: data.theirZone?.id,
        zoneName: data.theirZone?.zoneName,
        district: data.theirZone?.district,
      },
      theirPreacher: {
        id: data.theirPreacher?.id,
        firstName: data.theirPreacher?.firstName,
        lastName: data.theirPreacher?.lastName,
        roles: data.theirPreacher?.roles,
      },
      disciples: data.disciples.map((disciple) => ({
        id: disciple?.id,
        firstName: disciple?.firstName,
        lastName: disciple?.lastName,
      })),
    }));

    return result;
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

    // Validation zone
    const familyHouse = await this.familyHouseRepository.findOne({
      where: { id: id },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirZone',
        'theirPreacher',
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
          `To update a family home assign an existing zone id`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: theirZone },
        relations: [
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
        ],
      });

      if (!newZone) {
        throw new NotFoundException(`Not found Zone with id ${theirZone}`);
      }

      if (!newZone.status) {
        throw new BadRequestException(
          `The property status in Zone must be a "active"`,
        );
      }

      //* Find and validate Preacher
      if (!theirPreacher) {
        throw new NotFoundException(
          `To create a new family home assign an existing preacher id`,
        );
      }

      const newPreacher = await this.preacherRepository.findOne({
        where: { id: theirPreacher },
        relations: [
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
        ],
      });

      if (!newPreacher) {
        throw new NotFoundException(
          `Not found preacher with id ${theirPreacher}`,
        );
      }

      if (!newPreacher.status) {
        throw new BadRequestException(
          `The property status in Preacher must be a "active"`,
        );
      }

      //! Relations between preacher and zone must be same
      if (newZone.theirSupervisor.id !== newPreacher.theirSupervisor.id) {
        throw new BadRequestException(
          `The zone supervisor and the preacher supervisor must be the same`,
        );
      }

      if (newZone.theirCopastor.id !== newPreacher.theirCopastor.id) {
        throw new BadRequestException(
          `The zone co-pastor and the preacher's co-pastor must be the same`,
        );
      }

      if (newZone.theirPastor.id !== newPreacher.theirPastor.id) {
        throw new BadRequestException(
          `The zone pastor and the preacher's pastor must be the same`,
        );
      }

      if (newZone.theirChurch.id !== newPreacher.theirChurch.id) {
        throw new BadRequestException(
          `The zone church and the preacher's church must be the same`,
        );
      }

      //? Validation and assignment of other roles to the family home
      //* Validate and assign supervisor according preacher
      if (!newPreacher?.theirSupervisor) {
        throw new NotFoundException(
          `Supervisor was not found, verify that Preacher has a supervisor assigned`,
        );
      }

      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: newPreacher?.theirSupervisor?.id },
      });

      if (!newSupervisor.status) {
        throw new BadRequestException(
          `The property status in Supervisor must be a "active"`,
        );
      }

      //* Validate and assign copastor according preacher
      if (!newPreacher?.theirCopastor) {
        throw new NotFoundException(
          `Copastor was not found, verify that Preacher has a co-pastor assigned`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newPreacher?.theirCopastor?.id },
      });

      if (!newCopastor.status) {
        throw new BadRequestException(
          `The property status in Copastor must be a "active"`,
        );
      }

      //* Validate and assign pastor according preacher
      if (!newPreacher?.theirPastor) {
        throw new NotFoundException(
          `Pastor was not found, verify that Preacher has a pastor assigned`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newPreacher?.theirPastor?.id },
      });

      if (!newPastor.status) {
        throw new BadRequestException(
          `The property status in Pastor must be a "active"`,
        );
      }

      //* Validate and assign church according preacher
      if (!newPreacher?.theirChurch) {
        throw new NotFoundException(
          `Church was not found, verify that Preacher has a church assigned`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newPreacher?.theirChurch?.id },
      });

      if (!newChurch.status) {
        throw new BadRequestException(
          `The property status in Church must be a "active"`,
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
      let zoneName: string;

      if (allFamilyHousesByZone.length === 0) {
        houseNumber = 1;
        codeHouse = `${newZone.zoneName.toUpperCase()}-${houseNumber}`;
        zoneName = newZone.zoneName;
      }

      if (allFamilyHousesByZone.length !== 0) {
        houseNumber = allFamilyHousesByZone.length + 1;
        codeHouse = `${newZone.zoneName.toUpperCase()}-${houseNumber}`;
        zoneName = newZone.zoneName;
      }

      // Update and save
      const updatedFamilyHouse = await this.familyHouseRepository.preload({
        id: familyHouse.id,
        ...updateFamilyHouseDto,
        zoneName: zoneName,
        houseNumber: houseNumber,
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

      let savedFamilyHouse: FamilyHouse;
      try {
        savedFamilyHouse =
          await this.familyHouseRepository.save(updatedFamilyHouse);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Update in subordinate relations
      const allDisciples = await this.discipleRepository.find({
        relations: [
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
        ],
      });

      try {
        //* Reorder family house numbers and code in the old zone
        const allFamilyHousesByOrder = await this.familyHouseRepository.find({
          relations: ['theirZone'],
          order: { houseNumber: 'ASC' },
        });

        const allResult = allFamilyHousesByOrder.filter(
          (house) => house.theirZone?.id === familyHouse.theirZone?.id,
        );

        await Promise.all(
          allResult.map(async (familyHouse, index) => {
            await this.familyHouseRepository.update(familyHouse.id, {
              houseNumber: index + 1,
              codeHouse: `${familyHouse.zoneName.toUpperCase()}-${index + 1}`,
            });
          }),
        );

        //* Update and set to null relationships in Disciple
        const disciplesByFamilyHouse = allDisciples.filter(
          (disciple) => disciple.theirFamilyHouse?.id === familyHouse?.id,
        );

        await Promise.all(
          disciplesByFamilyHouse.map(async (disciple) => {
            await this.discipleRepository.update(disciple.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              theirSupervisor: newPreacher,
              theirZone: newZone,
              theirPreacher: newPreacher,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }
      return savedFamilyHouse;
    }

    //? Update if their Preacher is different and their Zone is same
    if (
      familyHouse.theirZone.id === theirZone &&
      familyHouse.theirPreacher.id !== theirPreacher
    ) {
      //* Find and validate Zone
      if (!theirZone) {
        throw new NotFoundException(
          `To update a family home assign an existing zone id`,
        );
      }

      const zone = await this.zoneRepository.findOne({
        where: { id: theirZone },
        relations: [
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
        ],
      });

      if (!zone) {
        throw new NotFoundException(`Not found Zone with id ${theirZone}`);
      }

      if (!zone.status) {
        throw new BadRequestException(
          `The property status in Zone must be a "active"`,
        );
      }

      //* Find and validate Preacher
      if (!theirPreacher) {
        throw new NotFoundException(
          `To update a family home assign an existing preacher id`,
        );
      }

      const newPreacher = await this.preacherRepository.findOne({
        where: { id: theirPreacher },
        relations: [
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
        ],
      });

      if (!newPreacher) {
        throw new NotFoundException(
          `Not found Preacher with id ${theirPreacher}`,
        );
      }

      if (!newPreacher.status) {
        throw new BadRequestException(
          `The property status in Preacher must be a "active"`,
        );
      }

      //! Relations between preacher and zone must be same
      if (zone.theirSupervisor.id !== newPreacher.theirSupervisor.id) {
        throw new BadRequestException(
          `The zone supervisor and the preacher supervisor must be the same`,
        );
      }

      if (zone.theirCopastor.id !== newPreacher.theirCopastor.id) {
        throw new BadRequestException(
          `The zone co-pastor and the preacher's co-pastor must be the same`,
        );
      }

      if (zone.theirPastor.id !== newPreacher.theirPastor.id) {
        throw new BadRequestException(
          `The area pastor and the preacher's pastor must be the same`,
        );
      }

      if (zone.theirChurch.id !== newPreacher.theirChurch.id) {
        throw new BadRequestException(
          `The area church and the preacher's church must be the same`,
        );
      }

      // Update and save
      const updatedFamilyHouse = await this.familyHouseRepository.preload({
        id: familyHouse.id,
        ...updateFamilyHouseDto,
        theirChurch: familyHouse.theirChurch,
        theirPastor: familyHouse.theirPastor,
        theirCopastor: familyHouse.theirCopastor,
        theirSupervisor: familyHouse.theirSupervisor,
        theirZone: zone,
        theirPreacher: newPreacher,
        updatedAt: new Date(),
        updatedBy: user,
        status: status,
      });

      let savedFamilyHouse: FamilyHouse;
      try {
        savedFamilyHouse =
          await this.familyHouseRepository.save(updatedFamilyHouse);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? All members by module
      const allDisciples = await this.discipleRepository.find({
        relations: [
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
        ],
      });

      try {
        //* Update and set to null relationships in Disciple
        const disciplesByFamilyHouse = allDisciples.filter(
          (disciple) => disciple.theirFamilyHouse?.id === familyHouse?.id,
        );

        await Promise.all(
          disciplesByFamilyHouse.map(async (disciple) => {
            await this.discipleRepository.update(disciple.id, {
              theirPreacher: newPreacher,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }

      return savedFamilyHouse;
    }

    // NOTE : Probable problema al cambiar de predicador donde lo tiene asignado otra casa familiar
    //? Update and save if is same Preacher and Zone
    if (
      familyHouse.theirZone.id === theirZone &&
      familyHouse.theirPreacher.id === theirPreacher
    ) {
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
      theirPreacher: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    try {
      await this.familyHouseRepository.save(updatedFamilyHouse);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirFamilyHouse'],
    });

    try {
      //* Update and set to null relationships in Disciple
      const disciplesByFamilyHouse = allDisciples.filter(
        (disciple) => disciple.theirFamilyHouse?.id === familyHouse?.id,
      );

      await Promise.all(
        disciplesByFamilyHouse.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirFamilyHouse: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);

    throw new InternalServerErrorException(
      'Unexpected errors, check server logs',
    );
  }
}
