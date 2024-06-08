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
import { MemberRoles, Status } from '@/common/enums';

import { CreatePreacherDto, UpdatePreacherDto } from '@/modules/preacher/dto';
import { Preacher } from '@/modules/preacher/entities';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities/';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyHouse } from '@/modules/family-house/entities';

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

    @InjectRepository(FamilyHouse)
    private readonly familyHouseRepository: Repository<FamilyHouse>,

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,
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
        `The role "disciple" and "preacher" must be included`,
      );
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Supervisor)
    ) {
      throw new BadRequestException(
        `To create a Preacher you must have the roles "disciple" and "preacher" or also "treasurer"`,
      );
    }

    if (!theirSupervisor) {
      throw new NotFoundException(
        `To create a new preacher place an existing supervisor id`,
      );
    }

    //* Validate and assign supervisor
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: theirSupervisor },
      relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Not found Supervisor with id ${theirSupervisor}`,
      );
    }

    if (supervisor.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Supervisor must be a "active"`,
      );
    }

    //* Validate and assign zone according supervisor
    if (!supervisor?.theirZone) {
      throw new NotFoundException(
        `Copastor was not found, verify that Supervisor has a copastor assigned`,
      );
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: supervisor?.theirZone?.id },
    });

    if (zone.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Zone must be "active"`,
      );
    }

    //* Validate and assign copastor according supervisor
    if (!supervisor?.theirCopastor) {
      throw new NotFoundException(
        `Copastor was not found, verify that Supervisor has a copastor assigned`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: supervisor?.theirCopastor?.id },
    });

    if (copastor.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Copastor must be "active"`,
      );
    }

    //* Validate and assign pastor according supervisor
    if (!supervisor?.theirPastor) {
      throw new NotFoundException(
        `Pastor was not found, verify that Supervisor has a pastor assigned`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: supervisor?.theirPastor?.id },
    });

    if (pastor.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Pastor must be "active"`,
      );
    }

    //* Validate and assign church according supervisor
    if (!supervisor?.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Copastor has a church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: supervisor?.theirChurch?.id },
    });

    if (church.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Church must be "active"`,
      );
    }

    // Create new instance
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

      return await this.preacherRepository.save(newPreacher);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    const data = await this.preacherRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirZone',
        'theirFamilyHouse',
        'disciples',
      ],
      relationLoadStrategy: 'query',
      order: { createdAt: 'ASC' },
    });

    const result = data.map((data) => ({
      ...data,
      theirChurch: {
        id: data.theirChurch.id,
        churchName: data.theirChurch.churchName,
      },
      theirPastor: {
        id: data.theirPastor.id,
        firstName: data.theirPastor.firstName,
        lastName: data.theirPastor.lastName,
        roles: data.theirPastor.roles,
      },
      theirCopastor: {
        id: data.theirCopastor.id,
        firstName: data.theirCopastor.firstName,
        lastName: data.theirCopastor.lastName,
        roles: data.theirCopastor.roles,
      },
      theirSupervisor: {
        id: data.theirSupervisor.id,
        firstName: data.theirSupervisor.firstName,
        lastName: data.theirSupervisor.lastName,
        roles: data.theirSupervisor.roles,
      },
      theirZone: {
        id: data.theirZone.id,
        zoneName: data.theirZone.zoneName,
        district: data.theirZone.district,
      },
      theirFamilyHouse: {
        id: data.theirFamilyHouse?.id,
        zoneName: data.theirFamilyHouse?.houseName,
        codeHouse: data.theirFamilyHouse?.codeHouse,
        district: data.theirFamilyHouse?.district,
        urbanSector: data.theirFamilyHouse?.urbanSector,
      },

      disciples: data.disciples.map((disciple) => ({
        id: disciple.id,
        firstName: disciple.firstName,
        lastName: disciple.lastName,
      })),
    }));

    return result;
  }

  findOne(id: number) {
    return `This action returns a #${id} preacher`;
  }

  //* UPDATE PREACHER
  async update(
    id: string,
    updatePreacherDto: UpdatePreacherDto,
    user: User,
  ): Promise<Preacher | Supervisor> {
    const { roles, status, theirSupervisor, theirCopastor } = updatePreacherDto;

    // Validations
    if (!roles) {
      throw new BadRequestException(
        `Required assign roles to update the preacher`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    // Validation preacher
    const preacher = await this.preacherRepository.findOne({
      where: { id: id },
      relations: [
        'theirSupervisor',
        'theirZone',
        'theirCopastor',
        'theirPastor',
        'theirChurch',
      ],
    });

    if (!preacher) {
      throw new NotFoundException(`Preacher not found with id: ${id}`);
    }

    if (!roles.some((role) => ['disciple', 'preacher'].includes(role))) {
      throw new BadRequestException(
        `The roles should include "disciple" and "preacher"`,
      );
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Supervisor)
    ) {
      throw new BadRequestException(
        `To create a Preacher you must have the roles "disciple" and "preacher" or also "treasurer"`,
      );
    }

    if (
      (preacher.roles.includes(MemberRoles.Preacher) &&
        preacher.roles.includes(MemberRoles.Disciple) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        !preacher.roles.includes(MemberRoles.Treasurer) &&
        (roles.includes(MemberRoles.Copastor) ||
          roles.includes(MemberRoles.Pastor))) ||
      (preacher.roles.includes(MemberRoles.Preacher) &&
        preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Treasurer) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        (roles.includes(MemberRoles.Copastor) ||
          roles.includes(MemberRoles.Pastor)))
    ) {
      throw new BadRequestException(
        `A lower or higher role cannot be assigned without going through the hierarchy: [preacher, supervisor, co-pastor, pastor]`,
      );
    }

    //* Update info about Preacher
    if (
      (preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Preacher) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Treasurer) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Preacher) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Supervisor) &&
        !roles.includes(MemberRoles.Treasurer)) ||
      (preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Preacher) &&
        preacher.roles.includes(MemberRoles.Treasurer) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Preacher) &&
        roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Supervisor))
    ) {
      // Validations
      if (preacher.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `You cannot update it to "inactive", you must delete the record`,
        );
      }

      //? Update if their Supervisor is different
      if (preacher.theirSupervisor?.id !== theirSupervisor) {
        //* Validate supervisor
        if (!theirSupervisor) {
          throw new NotFoundException(
            `To update copastor enter an existing copastor id`,
          );
        }

        const newSupervisor = await this.supervisorRepository.findOne({
          where: { id: theirSupervisor },
          relations: [
            'theirChurch',
            'theirPastor',
            'theirCopastor',
            'theirZone',
          ],
        });

        if (!newSupervisor) {
          throw new NotFoundException(
            `Supervisor not found with id ${theirSupervisor}`,
          );
        }

        if (newSupervisor.status === Status.Inactive) {
          throw new BadRequestException(
            `The property status in Supervisor must be "active"`,
          );
        }

        //* Validate Zone according supervisor
        if (!newSupervisor?.theirZone) {
          throw new BadRequestException(
            `Zone was not found, verify that Supervisor has a zone assigned`,
          );
        }

        const newZone = await this.zoneRepository.findOne({
          where: { id: newSupervisor?.theirZone?.id },
        });

        if (newZone.status === Status.Inactive) {
          throw new BadRequestException(
            `The property status in Zone must be "active"`,
          );
        }

        //* Validate Copastor according supervisor
        if (!newSupervisor?.theirCopastor) {
          throw new BadRequestException(
            `Copastor was not found, verify that Supervisor has a copastor assigned`,
          );
        }

        const newCopastor = await this.copastorRepository.findOne({
          where: { id: newSupervisor?.theirCopastor?.id },
        });

        if (newCopastor.status === Status.Inactive) {
          throw new BadRequestException(
            `The property status in Copastor must be "active"`,
          );
        }

        //* Validate Pastor according copastor
        if (!newSupervisor?.theirPastor) {
          throw new BadRequestException(
            `Pastor was not found, verify that Copastor has a pastor assigned`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newSupervisor?.theirPastor?.id },
        });

        if (newPastor.status === Status.Inactive) {
          throw new BadRequestException(
            `The property status in Pastor must be "active"`,
          );
        }

        //* Validate Church according copastor
        if (!newSupervisor?.theirChurch) {
          throw new BadRequestException(
            `Church was not found, verify that Copastor has a church assigned`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newSupervisor?.theirChurch?.id },
        });

        if (newChurch.status === Status.Inactive) {
          throw new BadRequestException(
            `The property status in Church must be "active"`,
          );
        }

        // Update and save
        const updatedPreacher = await this.preacherRepository.preload({
          id: preacher.id,
          ...updatePreacherDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
          theirZone: newZone,
          theirFamilyHouse: null,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        let savedPreacher: Preacher;
        try {
          savedPreacher = await this.preacherRepository.save(updatedPreacher);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //? Update in subordinate relations
        const allFamilyHouses = await this.familyHouseRepository.find({
          relations: ['theirPreacher', 'theirZone'],
        });

        const allDisciples = await this.discipleRepository.find({
          relations: ['theirPreacher'],
        });

        try {
          //* Update in all family houses the new relations of the copastor that is updated.
          const familyHousesByPreacher = allFamilyHouses.filter(
            (familyHouse) => familyHouse.theirPreacher?.id === preacher?.id,
          );

          const allFamilyHousesByZone = allFamilyHouses.filter(
            (house) => house.theirZone?.id === newZone?.id,
          );

          await Promise.all(
            familyHousesByPreacher.map(async (familyHouse) => {
              await this.familyHouseRepository.update(familyHouse.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
                theirSupervisor: newSupervisor,
                theirZone: newZone,
                zoneName: newZone.zoneName,
                houseNumber:
                  allFamilyHousesByZone.length === 0
                    ? 1
                    : allFamilyHousesByZone.length + 1,
                codeHouse:
                  allFamilyHousesByZone.length === 0
                    ? `${newZone.zoneName.toUpperCase()}-${1}`
                    : `${newZone.zoneName.toUpperCase()}-${allFamilyHousesByZone.length + 1}`,
              });
            }),
          );

          //* Update in all disciples the new relations of the copastor that is updated.
          const disciplesByPreacher = allDisciples.filter(
            (disciple) => disciple.theirPreacher?.id === preacher?.id,
          );

          await Promise.all(
            disciplesByPreacher.map(async (disciple) => {
              await this.discipleRepository.update(disciple.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
                theirSupervisor: newSupervisor,
                theirZone: newZone,
              });
            }),
          );

          //* Reordenar números de casas del antiguo zona
          const allFamilyHousesByOrder = await this.familyHouseRepository.find({
            relations: ['theirPreacher', 'theirZone'],
            order: { houseNumber: 'ASC' },
          });

          const allResult = allFamilyHousesByOrder.filter(
            (house) => house.theirZone?.id !== newZone?.id,
          );

          await Promise.all(
            allResult.map(async (familyHouse, index) => {
              await this.familyHouseRepository.update(familyHouse.id, {
                houseNumber: index + 1,
                codeHouse: `${familyHouse.zoneName.toUpperCase()}-${index + 1}`,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }

        return savedPreacher;
      }

      //? Update and save if is same Copastor
      if (preacher.theirSupervisor?.id === theirSupervisor) {
        const updatedPreacher = await this.preacherRepository.preload({
          id: preacher.id,
          ...updatePreacherDto,
          theirChurch: preacher.theirChurch,
          theirPastor: preacher.theirPastor,
          theirCopastor: preacher.theirCopastor,
          theirZone: preacher.theirZone,
          theirSupervisor: preacher.theirSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          return await this.preacherRepository.save(updatedPreacher);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Raise Preacher level to Supervisor
    if (
      (preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Preacher) &&
        !preacher.roles.includes(MemberRoles.Treasurer) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Supervisor) &&
        !roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Preacher) &&
        status === Status.Active) ||
      (preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Preacher) &&
        preacher.roles.includes(MemberRoles.Treasurer) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Supervisor) &&
        roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Preacher) &&
        status === Status.Active)
    ) {
      //* Validation new copastor
      if (!theirCopastor) {
        throw new NotFoundException(
          `To upgrade from preacher to supervisor place an existing co-pastor id`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: theirCopastor },
        relations: ['theirPastor', 'theirChurch'],
      });

      if (!newCopastor) {
        throw new NotFoundException(`Copastor not found with id: ${id}`);
      }

      if (newCopastor.status === Status.Inactive) {
        throw new NotFoundException(
          `The property status in Copastor must be a "active"`,
        );
      }

      //* Validation new pastor according copastor
      if (!newCopastor?.theirPastor) {
        throw new BadRequestException(
          `Pastor was not found, verify that Copastor has a pastor assigned`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newCopastor?.theirPastor?.id },
        relations: ['theirChurch'],
      });

      if (newPastor.status === Status.Inactive) {
        throw new NotFoundException(
          `The property status in Pastor must be a "active"`,
        );
      }

      //* Validation new church according copastor
      if (!newCopastor?.theirChurch) {
        throw new BadRequestException(
          `Church was not found, verify that Copastor has a church assigned`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newCopastor?.theirChurch?.id },
        relations: ['theirMainChurch'],
      });

      if (newChurch.status === Status.Inactive) {
        throw new NotFoundException(
          `The property status in Church must be a "active"`,
        );
      }

      // Create new instance Copastor and delete old supervisor
      try {
        const newSupervisor = this.supervisorRepository.create({
          ...updatePreacherDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          createdAt: new Date(),
          createdBy: user,
        });

        const savedSupervisor =
          await this.supervisorRepository.save(newSupervisor);

        await this.preacherRepository.remove(preacher); // onDelete subordinate entities (null)

        return savedSupervisor;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    } else {
      throw new BadRequestException(
        `You cannot level up, you must have the registry in "active" mode and the appropriate roles, review and update the registry.`,
      );
    }
  }

  // TODO : falta probar el preacher delete y la family house y luego el disciples
  // TODO : falta actualizar zona ordenando las promesas
  //! DELETE PREACHER
  async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const preacher = await this.preacherRepository.findOneBy({ id });

    if (!preacher) {
      throw new NotFoundException(`Preacher with id: ${id} not exits`);
    }

    //* Update and set in Inactive on Preacher
    const updatedPreacher = await this.preacherRepository.preload({
      id: preacher.id,
      theirChurch: null,
      theirPastor: null,
      theirCopastor: null,
      theirSupervisor: null,
      theirZone: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    try {
      await this.preacherRepository.save(updatedPreacher);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirPreacher'],
    });

    const allDisciples = await this.discipleRepository.find({
      relations: ['theirPreacher'],
    });

    try {
      //* Update and set to null relationships in Family House
      const familyHousesByPreacher = allFamilyHouses.filter(
        (familyHome) => familyHome.theirPreacher?.id === preacher?.id,
      );

      await Promise.all(
        familyHousesByPreacher.map(async (familyHome) => {
          await this.familyHouseRepository.update(familyHome.id, {
            theirPreacher: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciples
      const disciplesByPreacher = allDisciples.filter(
        (disciple) => disciple.theirPreacher?.id === preacher.id,
      );

      await Promise.all(
        disciplesByPreacher.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirPreacher: null,
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
