import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberRoles, Status } from '@/common/enums';

import { CreatePreacherDto, UpdatePreacherDto } from '@/modules/preacher/dto';
import { Preacher } from '@/modules/preacher/entities';

import { Supervisor } from '@/modules/supervisor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { User } from '@/modules/user/entities';
import { Zone } from '@/modules/zone/entities';
import { isUUID } from 'class-validator';
import { FamilyHouse } from '@/modules/family-house/entities';
import { Disciple } from '@/modules/disciple/entities/';
import { PaginationDto } from '@/common/dtos';

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
    if (!theirSupervisor) {
      throw new NotFoundException(
        `Para crear un nuevo preacher coloque un supervisor id existente`,
      );
    }

    const supervisor = await this.supervisorRepository.findOne({
      where: { id: theirSupervisor },
      relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
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

        return await this.preacherRepository.save(newPreacher);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<Preacher[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.preacherRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirSupervisor',
        'theirZone',
        'theirCopastor',
        'theirPastor',
        'theirChurch',
        'disciples',
        'familyHouses',
      ],
      order: { createdAt: 'ASC' },
    });
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

    // validation preacher
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
      preacher.roles.includes(MemberRoles.Preacher) &&
      preacher.roles.includes(MemberRoles.Disciple) &&
      !preacher.roles.includes(MemberRoles.Preacher) &&
      !preacher.roles.includes(MemberRoles.Copastor) &&
      !preacher.roles.includes(MemberRoles.Pastor) &&
      !preacher.roles.includes(MemberRoles.Treasurer) &&
      (roles.includes(MemberRoles.Copastor) ||
        roles.includes(MemberRoles.Pastor))
    ) {
      throw new BadRequestException(
        `A lower or higher role cannot be assigned without going through the hierarchy: [preacher, supervisor, co-pastor, pastor]`,
      );
    }

    //* Update info about Preacher
    if (
      preacher.roles.includes(MemberRoles.Disciple) &&
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
      !roles.includes(MemberRoles.Treasurer)
    ) {
      // Validations
      if (preacher.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `You cannot update it to "inactive", you must delete the record`,
        );
      }

      //? Update if their Supervisor is different
      if (preacher.theirSupervisor?.id !== theirSupervisor) {
        // Validate supervisor
        if (!theirSupervisor) {
          throw new NotFoundException(
            `Para actualizar o cambiar de copastor coloque un copastor id existente`,
          );
        }

        const newSupervisor = await this.supervisorRepository.findOne({
          where: { id: theirSupervisor },
          relations: [
            'theirZone',
            'theirCopastor',
            'theirPastor',
            'theirChurch',
          ],
        });

        if (!newSupervisor) {
          throw new NotFoundException(
            `Supervisor not found with id ${theirSupervisor}`,
          );
        }

        if (!newSupervisor.status) {
          throw new BadRequestException(
            `The property status in Copastor must be "Active"`,
          );
        }

        // Validate Zone according supervisor
        if (!newSupervisor.theirZone) {
          throw new BadRequestException(
            `Zone was not found, verify that Supervisor has a Zone assigned`,
          );
        }

        const newZone = await this.zoneRepository.findOne({
          where: { id: newSupervisor?.theirZone?.id },
          relations: ['preachers'],
        });

        if (!newZone.status) {
          throw new BadRequestException(
            `The property status in Pastor must be "Active"`,
          );
        }

        // Validate Copastor according supervisor
        if (!newSupervisor.theirCopastor) {
          throw new BadRequestException(
            `Copastor was not found, verify that Supervisor has a Copastor assigned`,
          );
        }

        const newCopastor = await this.copastorRepository.findOne({
          where: { id: newSupervisor?.theirCopastor?.id },
          relations: ['preachers'],
        });

        if (!newCopastor.status) {
          throw new BadRequestException(
            `The property status in Pastor must be "Active"`,
          );
        }

        // Validate Pastor according copastor
        if (!newSupervisor.theirPastor) {
          throw new BadRequestException(
            `Pastor was not found, verify that Copastor has a Pastor assigned`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newSupervisor?.theirPastor?.id },
          relations: ['preachers'],
        });

        if (!newPastor.status) {
          throw new BadRequestException(
            `The property status in Pastor must be "Active"`,
          );
        }

        // Validate Church according copastor
        if (!newSupervisor.theirChurch) {
          throw new BadRequestException(
            `Church was not found, verify that Copastor has a Church assigned`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newSupervisor?.theirChurch?.id },
          relations: ['preachers'],
        });

        if (!newChurch.status) {
          throw new BadRequestException(
            `The property status in Church must be "Active"`,
          );
        }

        //? All members by module
        const allFamilyHouses = await this.familyHouseRepository.find({
          relations: [
            'theirPreacher',
            'theirSupervisor',
            'theirCopastor',
            'theirPastor',
            'theirChurch',
          ],
        });
        const allDisciples = await this.discipleRepository.find({
          relations: [
            'theirPreacher',
            'theirSupervisor',
            'theirCopastor',
            'theirPastor',
            'theirChurch',
          ],
        });

        //* Update in all family houses the new relations of the copastor that is updated.
        const familyHousesByPreacher = allFamilyHouses.filter(
          (familyHouse) => familyHouse.theirPreacher?.id === preacher?.id,
        );

        const updateFamilyHouses = familyHousesByPreacher.map(
          async (familyHouse) => {
            await this.familyHouseRepository.update(familyHouse.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              theirSupervisor: newSupervisor,
            });
          },
        );

        //* Update in all disciples the new relations of the copastor that is updated.
        const disciplesByPreacher = allDisciples.filter(
          (disciple) => disciple.theirPreacher?.id === preacher?.id,
        );

        const updateDisciples = disciplesByPreacher.map(async (disciple) => {
          await this.discipleRepository.update(disciple.id, {
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: newCopastor,
            theirSupervisor: newSupervisor,
          });
        });

        // Update and save
        const updatedPreacher = await this.preacherRepository.preload({
          id: preacher.id,
          ...updatePreacherDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          await Promise.all(updateFamilyHouses);
          await Promise.all(updateDisciples);

          return await this.preacherRepository.save(updatedPreacher);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? Update and save if is same Copastor
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

    // TODO : tmb agregar que se puede poner tesorero en predicador y supervisor
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
      // Validation new copastor
      if (!theirCopastor) {
        throw new NotFoundException(
          `Para subir de nivel de preacher a supervisor coloque un copastor id existente`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: theirCopastor },
        relations: ['theirPastor', 'theirChurch'],
      });

      if (!newCopastor) {
        throw new NotFoundException(`Copastor not found with id: ${id}`);
      }

      if (newCopastor.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Pastor must be a "Active"`,
        );
      }

      // Validation new pastor according copastor
      if (!newCopastor?.theirPastor) {
        throw new BadRequestException(
          `Pastor was not found, verify that Copastor has a Pastor assigned`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newCopastor?.theirPastor?.id },
        relations: ['theirChurch'],
      });

      if (newPastor.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Pastor must be a "Active"`,
        );
      }

      // Validation new church according copastor
      if (!newCopastor?.theirChurch) {
        throw new BadRequestException(
          `Church was not found, verify that Copastor has a Church assigned`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newCopastor?.theirChurch?.id },
        relations: ['theirMainChurch'],
      });

      if (newChurch.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Church must be a "Active"`,
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
        `You cannot level up, you must have the "Active"`,
      );
    }
  }

  //! DELETE SUPERVISOR
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
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    // Update and set to null relationships in Family House (who have same Preacher)
    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirPreacher'],
    });
    const familyHousesByPreacher = allFamilyHouses.filter(
      (familyHome) => familyHome.theirPreacher?.id === preacher?.id,
    );

    const deleteSupervisorInFamilyHouses = familyHousesByPreacher.map(
      async (familyHome) => {
        await this.familyHouseRepository.update(familyHome.id, {
          theirPreacher: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Disciple, all those (who have the same Preacher).
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirPreacher'],
    });

    const disciplesByPreacher = allDisciples.filter(
      (disciple) => disciple.theirPreacher?.id === preacher.id,
    );

    const deleteSupervisorInDisciples = disciplesByPreacher.map(
      async (disciple) => {
        await this.discipleRepository.update(disciple?.id, {
          theirPreacher: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and save
    try {
      await Promise.all(deleteSupervisorInFamilyHouses);
      await Promise.all(deleteSupervisorInDisciples);

      await this.preacherRepository.save(updatedPreacher);
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
