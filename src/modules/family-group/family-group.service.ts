import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';

import { Status } from '@/common/enums';
import { PaginationDto } from '@/common/dtos';

import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
} from '@/modules/family-group/dto';
import { FamilyGroup } from '@/modules/family-group/entities';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';

@Injectable()
export class FamilyGroupService {
  private readonly logger = new Logger('FamilyGroupService');

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

    @InjectRepository(FamilyGroup)
    private readonly familyGroupRepository: Repository<FamilyGroup>,

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,
  ) {}

  //* CREATE FAMILY HOME
  async create(
    createFamilyGroupDto: CreateFamilyGroupDto,
    user: User,
  ): Promise<FamilyGroup> {
    const { theirPreacher, theirZone } = createFamilyGroupDto;

    //? Find and validate Zone
    if (!theirZone) {
      throw new NotFoundException(
        `Para crear un nuevo grupo familiar, asigne un ID de Zona existente.`,
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
      throw new NotFoundException(`Zona con id ${theirZone} no encontrada.`);
    }

    if (zone.status === Status.Inactive) {
      throw new BadRequestException(
        `La propiedad estado en Zona debe ser "Activo"`,
      );
    }

    //? Find and validate Preacher
    if (!theirPreacher) {
      throw new NotFoundException(
        `Para crear un nuevo grupo familiar, asigne un ID de Predicador existente.`,
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
        `Predicador con id ${theirPreacher} no encontrado.`,
      );
    }

    if (preacher.status === Status.Inactive) {
      throw new BadRequestException(
        `La propiedad estado en Predicador debe ser "Activo"`,
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

    //? Validation and assignment of other roles to the family group
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
    });

    if (church.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Church must be a "active"`,
      );
    }

    //? Assignment of number and code to the family group
    const allFamilyGroups = await this.familyGroupRepository.find({
      relations: ['theirZone'],
    });
    const allFamilyGroupsByZone = allFamilyGroups.filter(
      (familyGroup) => familyGroup.theirZone?.id === zone?.id,
    );

    let familyGroupNumber: number;
    let familyGroupCode: string;
    let zoneName: string;

    if (allFamilyGroupsByZone.length === 0) {
      familyGroupNumber = 1;
      familyGroupCode = `${zone.zoneName.toUpperCase()}-${familyGroupNumber}`;
      zoneName = zone.zoneName;
    }

    if (allFamilyGroupsByZone.length !== 0) {
      familyGroupNumber = allFamilyGroupsByZone.length + 1;
      familyGroupCode = `${zone.zoneName.toUpperCase()}-${familyGroupNumber}`;
      zoneName = zone.zoneName;
    }

    // Create new instance
    try {
      const newFamilyGroup = this.familyGroupRepository.create({
        ...createFamilyGroupDto,
        familyGroupNumber: familyGroupNumber,
        zoneName: zoneName,
        familyGroupCode: familyGroupCode,
        theirChurch: church,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirSupervisor: supervisor,
        theirPreacher: preacher,
        theirZone: zone,
        createdAt: new Date(),
        createdBy: user,
      });

      const savedFamilyGroup =
        await this.familyGroupRepository.save(newFamilyGroup);

      preacher.theirFamilyGroup = savedFamilyGroup;

      await this.preacherRepository.save(preacher);

      return savedFamilyGroup;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    const data = await this.familyGroupRepository.find({
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
      relationLoadStrategy: 'query',
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
    return `This action returns a #${id} familyGroup`;
  }

  //* UPDATE FAMILY HOUSE
  async update(
    id: string,
    updateFamilyGroupDto: UpdateFamilyGroupDto,
    user: User,
  ): Promise<FamilyGroup> {
    const { status, theirPreacher } = updateFamilyGroupDto;

    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    // Validation zone
    const familyGroup = await this.familyGroupRepository.findOne({
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

    if (!familyGroup) {
      throw new NotFoundException(`Family Group not found with id: ${id}`);
    }

    if (familyGroup.status === Status.Active && status === Status.Inactive) {
      throw new BadRequestException(
        `You cannot update it to "inactive", you must delete the record`,
      );
    }

    //? Update if their Preacher and their Zone is different
    if (familyGroup.theirPreacher.id !== theirPreacher) {
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
          'theirFamilyGroup',
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

      //? Validation and assignment of other roles to the family group
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

      //* Validate and assign zone according preacher
      if (!newPreacher?.theirZone) {
        throw new NotFoundException(
          `Zone was not found, verify that Preacher has a zone assigned`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: newPreacher?.theirZone?.id },
      });

      if (!newZone.status) {
        throw new BadRequestException(
          `The property status in Zone must be a "active"`,
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

      //? Update in subordinate relations
      const allDisciples = await this.discipleRepository.find({
        relations: ['theirFamilyGroup'],
      });

      //! Eliminar relaciones de family group y preacher (independiente)
      //* Setear a null el family house en el antiguo preacher
      if (familyGroup?.theirPreacher?.id) {
        const updateOldPreacher = await this.preacherRepository.preload({
          id: familyGroup?.theirPreacher?.id,
          theirFamilyGroup: null,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        await this.preacherRepository.save(updateOldPreacher);
      }

      //* Setear a null el preacher en el antiguo family house
      if (familyGroup?.id) {
        const updateOldFamilyGroup = await this.familyGroupRepository.preload({
          id: familyGroup?.id,
          theirPreacher: null,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        await this.familyGroupRepository.save(updateOldFamilyGroup);
      }

      //* Setear a null el preacher de la nueva family house
      if (newPreacher?.theirFamilyGroup?.id) {
        const updatedNewFamilyGroup = await this.familyGroupRepository.preload({
          id: newPreacher?.theirFamilyGroup?.id,
          theirPreacher: null,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        await this.familyGroupRepository.save(updatedNewFamilyGroup);
      }

      //! Quitamos del nuevo preacher todas sus relaciones subordinadas porque pertenecerá a otra family house
      try {
        //* Update and set to null relationships in Disciple
        const disciplesByNewZone = allDisciples.filter(
          (disciple) =>
            disciple.theirFamilyGroup?.id === newPreacher?.theirFamilyGroup?.id,
        );

        await Promise.all(
          disciplesByNewZone.map(async (disciple) => {
            await this.discipleRepository.update(disciple.id, {
              theirPreacher: null,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Si la zona es diferente cambia todo su info por una nueva, según preacher
      if (familyGroup.theirZone.id !== newZone.id) {
        //* Assignment of number and code to the family home
        const allFamilyGroups = await this.familyGroupRepository.find({
          relations: ['theirZone'],
        });

        const allFamilyGroupsByZone = allFamilyGroups.filter(
          (familyGroup) => familyGroup.theirZone?.id === newZone?.id,
        );

        let familyGroupNumber: number;
        let familyGroupCode: string;
        let zoneName: string;

        if (allFamilyGroupsByZone.length === 0) {
          familyGroupNumber = 1;
          familyGroupCode = `${newZone.zoneName.toUpperCase()}-${familyGroupNumber}`;
          zoneName = newZone.zoneName;
        }

        if (allFamilyGroupsByZone.length !== 0) {
          familyGroupNumber = allFamilyGroupsByZone.length + 1;
          familyGroupCode = `${newZone.zoneName.toUpperCase()}-${familyGroupNumber}`;
          zoneName = newZone.zoneName;
        }

        // Update and save
        const updatedFamilyGroup = await this.familyGroupRepository.preload({
          id: familyGroup.id,
          ...updateFamilyGroupDto,
          zoneName: zoneName,
          familyGroupNumber: familyGroupNumber,
          familyGroupCode: familyGroupCode,
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

        let savedFamilyGroup: FamilyGroup;
        try {
          newPreacher.theirFamilyGroup = null;
          await this.preacherRepository.save(newPreacher);

          savedFamilyGroup =
            await this.familyGroupRepository.save(updatedFamilyGroup);

          newPreacher.theirFamilyGroup = savedFamilyGroup;
          newPreacher.updatedAt = new Date();
          newPreacher.updatedBy = user;

          await this.preacherRepository.save(newPreacher);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        try {
          //* Reorder family house numbers and code in the old zone
          const allFamilyGroupsByOrder = await this.familyGroupRepository.find({
            relations: ['theirZone'],
            order: { familyGroupNumber: 'ASC' },
          });

          const allResult = allFamilyGroupsByOrder.filter(
            (house) => house.theirZone?.id === familyGroup.theirZone?.id,
          );

          await Promise.all(
            allResult.map(async (familyGroup, index) => {
              await this.familyGroupRepository.update(familyGroup.id, {
                familyGroupNumber: index + 1,
                familyGroupCode: `${familyGroup.zoneName.toUpperCase()}-${index + 1}`,
              });
            }),
          );

          //* Update and set new relationships in Disciple
          const disciplesByFamilyGroup = allDisciples.filter(
            (disciple) => disciple.theirFamilyGroup?.id === familyGroup?.id,
          );

          await Promise.all(
            disciplesByFamilyGroup.map(async (disciple) => {
              await this.discipleRepository.update(disciple.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
                theirSupervisor: newSupervisor,
                theirZone: newZone,
                theirPreacher: newPreacher,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }
        return savedFamilyGroup;
      }

      //? Si la zona es la misma, se mantiene los mismo datos, solo cambia el preacher
      if (familyGroup.theirZone.id === newZone.id) {
        // Update and save
        const updatedFamilyGroup = await this.familyGroupRepository.preload({
          id: familyGroup.id,
          ...updateFamilyGroupDto,
          theirChurch: familyGroup.theirChurch,
          theirPastor: familyGroup.theirPastor,
          theirCopastor: familyGroup.theirCopastor,
          theirSupervisor: familyGroup.theirSupervisor,
          theirZone: familyGroup.theirZone,
          theirPreacher: newPreacher,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        let savedFamilyGroup: FamilyGroup;
        try {
          newPreacher.theirFamilyGroup = null;
          await this.preacherRepository.save(newPreacher);

          savedFamilyGroup =
            await this.familyGroupRepository.save(updatedFamilyGroup);

          newPreacher.theirFamilyGroup = savedFamilyGroup;
          newPreacher.updatedAt = new Date();
          newPreacher.updatedBy = user;

          await this.preacherRepository.save(newPreacher);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        try {
          //* Update and set new relationships in Disciple
          const disciplesByFamilyGroup = allDisciples.filter(
            (disciple) => disciple.theirFamilyGroup?.id === familyGroup?.id,
          );

          await Promise.all(
            disciplesByFamilyGroup.map(async (disciple) => {
              await this.discipleRepository.update(disciple.id, {
                theirChurch: familyGroup.theirChurch,
                theirPastor: familyGroup.theirPastor,
                theirCopastor: familyGroup.theirCopastor,
                theirSupervisor: familyGroup.theirSupervisor,
                theirZone: familyGroup.theirZone,
                theirPreacher: newPreacher,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }
        return savedFamilyGroup;
      }
    }

    //? Update and save if is same Preacher and Zone
    if (familyGroup.theirPreacher.id === theirPreacher) {
      const updatedFamilyGroup = await this.familyGroupRepository.preload({
        id: familyGroup.id,
        ...updateFamilyGroupDto,
        theirChurch: familyGroup.theirChurch,
        theirPastor: familyGroup.theirPastor,
        theirCopastor: familyGroup.theirCopastor,
        theirSupervisor: familyGroup.theirSupervisor,
        theirZone: familyGroup.theirZone,
        theirPreacher: familyGroup.theirPreacher,
        updatedAt: new Date(),
        updatedBy: user,
        status: status,
      });

      try {
        return await this.familyGroupRepository.save(updatedFamilyGroup);
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

    const familyGroup = await this.familyGroupRepository.findOneBy({ id });

    if (!familyGroup) {
      throw new NotFoundException(`Family Group with id: ${id} not exits`);
    }

    //* Update and set in Inactive on Family House
    const updatedFamilyGroup = await this.familyGroupRepository.preload({
      id: familyGroup.id,
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
      await this.familyGroupRepository.save(updatedFamilyGroup);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirFamilyGroup'],
    });

    try {
      //* Update and set to null relationships in Disciple
      const disciplesByFamilyGroup = allDisciples.filter(
        (disciple) => disciple.theirFamilyGroup?.id === familyGroup?.id,
      );

      await Promise.all(
        disciplesByFamilyGroup.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirFamilyGroup: null,
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
