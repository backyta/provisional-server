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
      const familyHousesInZone = [
        ...(zone.familyHouses || []),
        savedFamilyHouse,
      ];
      zone.familyHouses = familyHousesInZone;
      zone.numberFamilyHouses = familyHousesInZone.length;

      // Count and assign family houses in Supervisor
      const familyHousesInSupervisor = [
        ...(supervisor.familyHouses || []),
        savedFamilyHouse,
      ];
      supervisor.familyHouses = familyHousesInSupervisor;
      supervisor.numberFamilyHouses = familyHousesInSupervisor.length;

      // Count and assign family houses in Preacher
      const familyHousesInPreacher = [
        ...(preacher.familyHouses || []),
        savedFamilyHouse,
      ];
      preacher.familyHouses = familyHousesInPreacher;
      preacher.numberFamilyHouses = familyHousesInPreacher.length;

      // Count and assign family houses in Copastor
      const familyHousesInCopastor = [
        ...(copastor.familyHouses || []),
        savedFamilyHouse,
      ];
      copastor.familyHouses = familyHousesInCopastor;
      copastor.numberFamilyHouses = familyHousesInCopastor.length;

      // Count and assign family houses in Pastor
      const familyHousesInPastor = [
        ...(pastor.familyHouses || []),
        savedFamilyHouse,
      ];
      pastor.familyHouses = familyHousesInPastor;
      pastor.numberFamilyHouses = familyHousesInPastor.length;

      // Count and assign family houses in Church
      const familyHousesInChurch = [
        ...(church.familyHouses || []),
        savedFamilyHouse,
      ];
      church.familyHouses = familyHousesInChurch;
      church.numberFamilyHouses = familyHousesInChurch.length;

      await this.zoneRepository.save(zone);
      await this.supervisorRepository.save(supervisor);
      await this.preacherRepository.save(preacher);
      await this.copastorRepository.save(copastor);
      await this.pastorRepository.save(pastor);
      await this.churchRepository.save(church);

      return savedFamilyHouse;
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
    const { status, theirPreacher } = updateFamilyHouseDto;

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

    //? Update if their Preacher is different
    if (familyHouse.theirPreacher?.id !== theirPreacher) {
      //* Validate preacher
      const newPreacher = await this.preacherRepository.findOne({
        where: { id: theirPreacher },
        relations: ['familyHouses', 'disciples'],
      });

      if (!newPreacher) {
        throw new NotFoundException(
          `Preacher not found with id ${theirPreacher}`,
        );
      }

      if (!newPreacher.status) {
        throw new BadRequestException(
          `The property status in Preacher must be "Active"`,
        );
      }

      //* Validate Supervisor according preacher
      if (!newPreacher.theirCopastor) {
        throw new BadRequestException(
          `Supervisor was not found, verify that Preacher has a Supervisor assigned`,
        );
      }

      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: newPreacher?.theirSupervisor?.id },
        relations: ['theirZone', 'preachers', 'familyHouses', 'disciples'],
      });

      if (!newSupervisor.status) {
        throw new BadRequestException(
          `The property status in Supervisor must be "Active"`,
        );
      }

      //* Validate Zone according preacher
      if (!newPreacher.theirZone) {
        throw new BadRequestException(
          `Zone was not found, verify that Preacher has a Zone assigned`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: newPreacher?.theirZone?.id },
        relations: [
          'theirSupervisor',
          'preachers',
          'familyHouses',
          'disciples',
        ],
      });

      if (!newZone.status) {
        throw new BadRequestException(
          `The property status in Supervisor must be "Active"`,
        );
      }

      //* Validate Copastor according preacher
      if (!newPreacher.theirCopastor) {
        throw new BadRequestException(
          `Copastor was not found, verify that Supervisor has a Copastor assigned`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newPreacher?.theirCopastor?.id },
        relations: [
          'supervisors',
          'zones',
          'preachers',
          'familyHouses',
          'disciples',
        ],
      });

      if (!newCopastor.status) {
        throw new BadRequestException(
          `The property status in Copastor must be "Active"`,
        );
      }

      //* Validate Pastor according preacher
      if (!newCopastor.theirPastor) {
        throw new BadRequestException(
          `Pastor was not found, verify that Supervisor has a Pastor assigned`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newPreacher?.theirPastor?.id },
        relations: [
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyHouses',
          'disciples',
        ],
      });

      if (!newPastor.status) {
        throw new BadRequestException(
          `The property status in Pastor must be "Active"`,
        );
      }

      //* Validate Church according preacher
      if (!newPreacher.theirChurch) {
        throw new BadRequestException(
          `Church was not found, verify that Supervisor has a Church assigned`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newPreacher?.theirChurch?.id },
        relations: [
          'pastors',
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyHouses',
          'disciples',
        ],
      });

      if (!newChurch.status) {
        throw new BadRequestException(
          `The property status in Church must be "Active"`,
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
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newPreacher,
          theirZone: newZone,
          theirPreacher: newPreacher,
        });
      });

      // Data old Preacher
      const oldPreacher = await this.preacherRepository.findOne({
        where: { id: familyHouse?.theirPreacher?.id },
        relations: ['familyHouses', 'disciples', 'disciples.theirFamilyHouse'],
      });

      // Data old Zone
      const oldZone = await this.zoneRepository.findOne({
        where: { id: familyHouse?.theirZone?.id },
        relations: ['familyHouses', 'disciples', 'disciples.theirFamilyHouse'],
      });

      // Data old Supervisor
      const oldSupervisor = await this.supervisorRepository.findOne({
        where: { id: familyHouse?.theirSupervisor?.id },
        relations: ['familyHouses', 'disciples', 'disciples.theirFamilyHouse'],
      });

      // Data old Copastor
      const oldCopastor = await this.copastorRepository.findOne({
        where: { id: familyHouse?.theirCopastor?.id },
        relations: ['familyHouses', 'disciples', 'disciples.theirFamilyHouse'],
      });

      // Data old Pastor
      const oldPastor = await this.pastorRepository.findOne({
        where: { id: familyHouse?.theirPastor?.id },
        relations: ['familyHouses', 'disciples', 'disciples.theirFamilyHouse'],
      });

      // Data old curch
      const oldChurch = await this.churchRepository.findOne({
        where: { id: familyHouse?.theirChurch?.id },
        relations: ['familyHouses', 'disciples', 'disciples.theirFamilyHouse'],
      });

      //! Delete family house relation and subtract amount on the old preacher
      // Filter family houses the old preacher
      const familyHousesOldPreacher = oldPreacher?.familyHouses.filter(
        (oldFamilyHouse) => oldFamilyHouse?.id !== familyHouse?.id,
      );
      oldPreacher.familyHouses = familyHousesOldPreacher;
      oldPreacher.numberFamilyHouses = familyHousesOldPreacher.length;

      // Filter disciples the old preacher
      const disciplesOldPreacher = oldPreacher?.disciples.filter(
        (oldDisciple) => oldDisciple?.theirFamilyHouse?.id !== familyHouse?.id,
      );
      oldPreacher.disciples = disciplesOldPreacher;
      oldPreacher.numberDisciples = disciplesOldPreacher.length;

      //! Delete family house relation and subtract amount on the old zone
      // Filter family houses the old zone
      const familyHousesOldZone = oldZone?.familyHouses.filter(
        (oldFamilyHouse) => oldFamilyHouse?.id !== familyHouse?.id,
      );
      oldZone.familyHouses = familyHousesOldZone;
      oldZone.numberFamilyHouses = familyHousesOldZone.length;

      // Filter disciples the old zone
      const disciplesOldZone = oldZone?.disciples.filter(
        (oldDisciple) => oldDisciple?.theirFamilyHouse?.id !== familyHouse?.id,
      );
      oldZone.disciples = disciplesOldZone;
      oldZone.numberDisciples = disciplesOldZone.length;

      //! Delete family house relation and subtract amount on the old supervisor
      // Filter family houses the old supervisor
      const familyHousesOldSupervisor = oldSupervisor?.familyHouses.filter(
        (oldFamilyHouse) => oldFamilyHouse?.id !== familyHouse?.id,
      );
      oldSupervisor.familyHouses = familyHousesOldSupervisor;
      oldSupervisor.numberFamilyHouses = familyHousesOldSupervisor.length;

      // Filter disciples the old supervisor
      const disciplesOldSupervisor = oldSupervisor?.disciples.filter(
        (oldDisciple) => oldDisciple?.theirFamilyHouse?.id !== familyHouse?.id,
      );
      oldSupervisor.disciples = disciplesOldSupervisor;
      oldSupervisor.numberDisciples = disciplesOldSupervisor.length;

      //! Delete family house relation and subtract amount on the old co-pastor
      // Filter family houses the old copastor
      const familyHousesOldCopastor = oldCopastor?.familyHouses.filter(
        (oldFamilyHouse) => oldFamilyHouse?.id !== familyHouse?.id,
      );
      oldCopastor.familyHouses = familyHousesOldCopastor;
      oldCopastor.numberFamilyHouses = familyHousesOldCopastor.length;

      // Filter disciples the old copastor
      const disciplesOldCopastor = oldCopastor?.disciples.filter(
        (oldDisciple) => oldDisciple?.theirFamilyHouse?.id !== familyHouse?.id,
      );
      oldCopastor.disciples = disciplesOldCopastor;
      oldCopastor.numberDisciples = disciplesOldCopastor.length;

      //! Delete family house relation and subtract amount on the old pastor
      // Filter family houses the old pastor
      const familyHousesOldPastor = oldPastor?.familyHouses.filter(
        (oldFamilyHouse) => oldFamilyHouse?.id !== familyHouse?.id,
      );
      oldPastor.familyHouses = familyHousesOldPastor;
      oldPastor.numberFamilyHouses = familyHousesOldPastor.length;

      // Filter disciples the old pastor
      const disciplesOldPastor = oldPastor?.disciples.filter(
        (oldDisciple) => oldDisciple?.theirFamilyHouse?.id !== familyHouse?.id,
      );
      oldPastor.disciples = disciplesOldPastor;
      oldPastor.numberDisciples = disciplesOldPastor.length;

      //! Delete family house relation and subtract amount on the old church
      // Filter family houses the old church
      const familyHousesOldChurch = oldChurch?.familyHouses.filter(
        (oldFamilyHouse) => oldFamilyHouse?.id !== familyHouse?.id,
      );
      oldChurch.familyHouses = familyHousesOldChurch;
      oldChurch.numberFamilyHouses = familyHousesOldChurch.length;

      // Filter disciples the old church
      const disciplesOldChurch = oldChurch?.disciples.filter(
        (oldDisciple) => oldDisciple?.theirFamilyHouse?.id !== familyHouse?.id,
      );
      oldChurch.disciples = disciplesOldChurch;
      oldChurch.numberDisciples = disciplesOldChurch.length;

      // Update and save
      const updatedFamilyHouse = await this.familyHouseRepository.preload({
        id: familyHouse.id,
        ...updateFamilyHouseDto,
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
        const savedFamilyHouse =
          await this.familyHouseRepository.save(updatedFamilyHouse);

        await Promise.all(updateDisciples);

        //* Assign relations to the new preacher, supervisor, zone, copastor, pastor and new church
        const familyHouseInNewPreacher = (newPreacher.familyHouses = [
          ...(newPreacher.familyHouses || []),
          savedFamilyHouse,
        ]);
        newPreacher.familyHouses = familyHouseInNewPreacher;
        newPreacher.numberFamilyHouses = familyHouseInNewPreacher.length;

        const familyHouseInNewSupervisor = (newSupervisor.familyHouses = [
          ...(newSupervisor.familyHouses || []),
          savedFamilyHouse,
        ]);
        newSupervisor.familyHouses = familyHouseInNewSupervisor;
        newSupervisor.numberFamilyHouses = familyHouseInNewSupervisor.length;

        const familyHouseInNewZone = (newZone.familyHouses = [
          ...(newZone.familyHouses || []),
          savedFamilyHouse,
        ]);
        newZone.familyHouses = familyHouseInNewZone;
        newZone.numberFamilyHouses = familyHouseInNewZone.length;

        const familyHousesInNewCopastor = (newCopastor.familyHouses = [
          ...(newCopastor.familyHouses || []),
          savedFamilyHouse,
        ]);
        newCopastor.familyHouses = familyHousesInNewCopastor;
        newCopastor.numberFamilyHouses = familyHousesInNewCopastor.length;

        const familyHousesInNewPastor = (newPastor.familyHouses = [
          ...(newPastor.familyHouses || []),
          savedFamilyHouse,
        ]);
        newPastor.familyHouses = familyHousesInNewPastor;
        newPastor.numberFamilyHouses = familyHousesInNewPastor.length;

        const zonesInNewChurch = (newChurch.familyHouses = [
          ...(newChurch.familyHouses || []),
          savedFamilyHouse,
        ]);
        newChurch.familyHouses = zonesInNewChurch;
        newChurch.numberFamilyHouses = zonesInNewChurch.length;

        await this.preacherRepository.save(oldPreacher);
        await this.preacherRepository.save(newPreacher);
        await this.zoneRepository.save(oldZone);
        await this.zoneRepository.save(newZone);
        await this.supervisorRepository.save(oldSupervisor);
        await this.supervisorRepository.save(newSupervisor);
        await this.copastorRepository.save(oldCopastor);
        await this.copastorRepository.save(newCopastor);
        await this.pastorRepository.save(oldPastor);
        await this.pastorRepository.save(newPastor);
        await this.churchRepository.save(oldChurch);
        await this.churchRepository.save(newChurch);

        return savedFamilyHouse;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is same Copastor
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
      return await this.supervisorRepository.save(updatedFamilyHouse);
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
    const updatedZone = await this.familyHouseRepository.preload({
      id: familyHouse.id,
      theirChurch: null,
      theirPastor: null,
      theirCopastor: null,
      theirSupervisor: null,
      theirZone: null,
      theirPreacher: null,
      disciples: [],
      numberDisciples: 0,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    // Update and set to null relationships in Disciple, all those (who have the same Zone).
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirFamilyHouse'],
    });

    const disciplesByFamilyHouse = allDisciples.filter(
      (disciple) => disciple.theirFamilyHouse?.id === familyHouse.id,
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

    //! Eliminate zone relation (id and amount) on their preacher, zone, supervisor, copastor, pastor and church
    // Preacher
    const theirPreacher = await this.preacherRepository.findOne({
      where: { id: familyHouse?.theirPreacher?.id },
      relations: ['familyHouses'],
    });

    const FamilyHousesInPreacher = theirPreacher.familyHouses.filter(
      (currentFamilyHouse) => currentFamilyHouse?.id !== familyHouse?.id,
    );

    theirPreacher.familyHouses = FamilyHousesInPreacher;
    theirPreacher.numberFamilyHouses = FamilyHousesInPreacher.length;

    // Supervisor
    const theirSupervisor = await this.supervisorRepository.findOne({
      where: { id: familyHouse?.theirSupervisor?.id },
      relations: ['familyHouses'],
    });

    const FamilyHousesInSupervisor = theirSupervisor.familyHouses.filter(
      (currentFamilyHouse) => currentFamilyHouse?.id !== familyHouse?.id,
    );

    theirSupervisor.familyHouses = FamilyHousesInSupervisor;
    theirSupervisor.numberFamilyHouses = FamilyHousesInSupervisor.length;

    // Zones
    const theirZone = await this.zoneRepository.findOne({
      where: { id: familyHouse?.theirZone?.id },
      relations: ['familyHouses'],
    });

    const FamilyHousesInZone = theirZone.familyHouses.filter(
      (currentFamilyHouse) => currentFamilyHouse?.id !== familyHouse?.id,
    );

    theirZone.familyHouses = FamilyHousesInZone;
    theirZone.numberFamilyHouses = FamilyHousesInZone.length;

    // Copastor
    const theirCopastor = await this.copastorRepository.findOne({
      where: { id: familyHouse?.theirCopastor?.id },
      relations: ['familyHouses'],
    });

    const familyHousesInCopastor = theirCopastor.familyHouses.filter(
      (currentFamilyHouse) => currentFamilyHouse?.id !== familyHouse?.id,
    );

    theirCopastor.familyHouses = familyHousesInCopastor;
    theirCopastor.numberFamilyHouses = familyHousesInCopastor.length;

    //Pastor
    const theirPastor = await this.pastorRepository.findOne({
      where: { id: familyHouse?.theirPastor?.id },
      relations: ['familyHouses'],
    });

    const familyHousesInPastor = theirPastor.familyHouses.filter(
      (currentFamilyHouse) => currentFamilyHouse?.id !== familyHouse?.id,
    );

    theirPastor.familyHouses = familyHousesInPastor;
    theirPastor.numberFamilyHouses = familyHousesInPastor.length;

    // Church
    const theirChurch = await this.churchRepository.findOne({
      where: { id: familyHouse?.theirChurch?.id },
      relations: ['familyHouses'],
    });

    const familyHousesInChurch = theirChurch.familyHouses.filter(
      (currentFamilyHouse) => currentFamilyHouse?.id !== familyHouse?.id,
    );

    theirChurch.familyHouses = familyHousesInChurch;
    theirChurch.numberFamilyHouses = familyHousesInChurch.length;

    // Update and save
    try {
      await this.zoneRepository.save(updatedZone);

      await Promise.all(deleteFamilyHouseInDisciple);

      await this.preacherRepository.save(theirPreacher);
      await this.zoneRepository.save(theirZone);
      await this.supervisorRepository.save(theirSupervisor);
      await this.copastorRepository.save(theirCopastor);
      await this.pastorRepository.save(theirPastor);
      await this.churchRepository.save(theirChurch);
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
