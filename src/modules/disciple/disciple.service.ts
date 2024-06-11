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

import { PaginationDto } from '@/common/dtos';
import { MemberRoles, Status } from '@/common/enums';

import { CreateDiscipleDto, UpdateDiscipleDto } from '@/modules/disciple/dto';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyHouse } from '@/modules/family-house/entities';

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
      throw new BadRequestException(`The "disciple" role must be included`);
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Preacher) ||
      roles.includes(MemberRoles.Supervisor) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `To create a Disciple you only need to have the "disciple" roles`,
      );
    }

    //? Validate and assign Family House
    if (!theirFamilyHouse) {
      throw new NotFoundException(
        `To create a new disciple place an existing family house id`,
      );
    }

    const familyHouse = await this.familyHouseRepository.findOne({
      where: { id: theirFamilyHouse },
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
      throw new NotFoundException(
        `Not found Family house with id ${theirFamilyHouse}`,
      );
    }

    if (!familyHouse.status) {
      throw new BadRequestException(
        `The property status in Family House must be a "active"`,
      );
    }

    //* Validate and assign preacher according family house
    if (!familyHouse?.theirPreacher) {
      throw new NotFoundException(
        `Preacher was not found, verify that Family House has a preacher assigned`,
      );
    }

    const preacher = await this.preacherRepository.findOne({
      where: { id: familyHouse?.theirPreacher?.id },
    });

    if (!preacher.status) {
      throw new BadRequestException(
        `The property status in Preacher must be "active"`,
      );
    }

    //* Validate and assign zone according family house
    if (!familyHouse?.theirZone) {
      throw new NotFoundException(
        `Zone was not found, verify that Family House has a zone assigned`,
      );
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: familyHouse?.theirZone?.id },
    });

    if (!zone.status) {
      throw new BadRequestException(
        `The property status in Zone must be "active"`,
      );
    }

    //* Validate and assign supervisor according family house
    if (!familyHouse?.theirSupervisor) {
      throw new NotFoundException(
        `Supervisor was not found, verify that Family House has a supervisor assigned`,
      );
    }

    const supervisor = await this.supervisorRepository.findOne({
      where: { id: familyHouse?.theirSupervisor?.id },
    });

    if (!supervisor.status) {
      throw new BadRequestException(
        `The property status in Supervisor must be "active"`,
      );
    }

    //* Validate and assign copastor according family house
    if (!familyHouse?.theirCopastor) {
      throw new NotFoundException(
        `Copastor was not found, verify that Family House has a co-pastor assigned`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: familyHouse?.theirCopastor?.id },
    });

    if (!copastor.status) {
      throw new BadRequestException(
        `The property status in Copastor must be "active"`,
      );
    }

    //* Validate and assign pastor according family house
    if (!familyHouse?.theirPastor) {
      throw new NotFoundException(
        `Pastor was not found, verify that Family House has a pastor assigned`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: familyHouse?.theirPastor?.id },
    });

    if (!pastor.status) {
      throw new BadRequestException(
        `The property status in Pastor must be "active"`,
      );
    }

    //* Validate and assign church according family house
    if (!familyHouse?.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Family House has a church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: familyHouse?.theirChurch?.id },
    });

    if (!church.status) {
      throw new BadRequestException(
        `The property status in Church must be "active"`,
      );
    }

    // Create new instance
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

      return await this.discipleRepository.save(newDisciple);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    const data = await this.discipleRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirFamilyHouse',
        'theirPreacher',
        'theirZone',
        'theirSupervisor',
        'theirPastor',
        'theirCopastor',
        'theirChurch',
      ],
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
      theirFamilyHouse: {
        id: data.theirFamilyHouse?.id,
        houseName: data.theirFamilyHouse?.houseName,
        codeHouse: data.theirFamilyHouse?.codeHouse,
        district: data.theirFamilyHouse?.district,
        urbanSector: data.theirFamilyHouse?.urbanSector,
      },
    }));

    return result;
  }

  findOne(id: number) {
    return `This action returns a #${id} disciple`;
  }

  //* UPDATE DISCIPLE
  async update(
    id: string,
    updateDiscipleDto: UpdateDiscipleDto,
    user: User,
  ): Promise<Disciple | Preacher> {
    const { roles, status, theirSupervisor, theirFamilyHouse } =
      updateDiscipleDto;

    // Validations
    if (!roles) {
      throw new BadRequestException(
        `Required assign roles to update the disciple`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    // validation disciple
    const disciple = await this.discipleRepository.findOne({
      where: { id: id },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirPreacher',
        'theirZone',
        'theirFamilyHouse',
      ],
    });

    if (!disciple) {
      throw new NotFoundException(`Disciple not found with id: ${id}`);
    }

    if (!roles.some((role) => ['disciple'].includes(role))) {
      throw new BadRequestException(`The roles should include "disciple"`);
    }

    if (
      disciple.roles.includes(MemberRoles.Disciple) &&
      !disciple.roles.includes(MemberRoles.Preacher) &&
      !disciple.roles.includes(MemberRoles.Preacher) &&
      !disciple.roles.includes(MemberRoles.Copastor) &&
      !disciple.roles.includes(MemberRoles.Pastor) &&
      !disciple.roles.includes(MemberRoles.Treasurer) &&
      (roles.includes(MemberRoles.Copastor) ||
        roles.includes(MemberRoles.Pastor) ||
        roles.includes(MemberRoles.Supervisor))
    ) {
      throw new BadRequestException(
        `A higher role cannot be assigned without going through the hierarchy: [disciple, preacher, supervisor, co-pastor, pastor]`,
      );
    }

    //* Update info about Disciple
    if (
      disciple.roles.includes(MemberRoles.Disciple) &&
      !disciple.roles.includes(MemberRoles.Preacher) &&
      !disciple.roles.includes(MemberRoles.Pastor) &&
      !disciple.roles.includes(MemberRoles.Copastor) &&
      !disciple.roles.includes(MemberRoles.Supervisor) &&
      !disciple.roles.includes(MemberRoles.Treasurer) &&
      roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Preacher) &&
      !roles.includes(MemberRoles.Pastor) &&
      !roles.includes(MemberRoles.Copastor) &&
      !roles.includes(MemberRoles.Supervisor) &&
      !roles.includes(MemberRoles.Treasurer)
    ) {
      // Validations
      if (disciple.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `You cannot update it to "inactive", you must delete the record`,
        );
      }

      //? Update if their Family House is different
      if (disciple.theirFamilyHouse?.id !== theirFamilyHouse) {
        //* Validate family house
        if (!theirFamilyHouse) {
          throw new NotFoundException(
            `To update or change disciple enter an existing copastor id`,
          );
        }

        const newFamilyHouse = await this.familyHouseRepository.findOne({
          where: { id: theirFamilyHouse },
          relations: [
            'theirChurch',
            'theirPastor',
            'theirCopastor',
            'theirSupervisor',
            'theirPreacher',
            'theirZone',
          ],
        });

        if (!newFamilyHouse) {
          throw new NotFoundException(
            `Family House not found with id ${theirFamilyHouse}`,
          );
        }

        if (!newFamilyHouse.status) {
          throw new BadRequestException(
            `The property status in Family House must be "active"`,
          );
        }

        //* Validate Preacher according family house
        if (!newFamilyHouse?.theirPreacher) {
          throw new BadRequestException(
            `Preacher was not found, verify that Family House has a preacher assigned`,
          );
        }

        const newPreacher = await this.preacherRepository.findOne({
          where: { id: newFamilyHouse?.theirPreacher?.id },
        });

        if (!newPreacher.status) {
          throw new BadRequestException(
            `The property status in Preacher must be "active"`,
          );
        }

        //* Validate Supervisor according family house
        if (!newFamilyHouse?.theirSupervisor) {
          throw new BadRequestException(
            `Supervisor was not found, verify that Family House has a supervisor assigned`,
          );
        }

        const newSupervisor = await this.supervisorRepository.findOne({
          where: { id: newFamilyHouse?.theirSupervisor?.id },
        });

        if (!newSupervisor.status) {
          throw new BadRequestException(
            `The property status in Supervisor must be "active"`,
          );
        }

        //* Validate Zone according family house
        if (!newFamilyHouse?.theirZone) {
          throw new BadRequestException(
            `Zone was not found, verify that Family House has a zone assigned`,
          );
        }

        const newZone = await this.zoneRepository.findOne({
          where: { id: newFamilyHouse?.theirZone?.id },
        });

        if (!newZone.status) {
          throw new BadRequestException(
            `The property status in Zone must be "active"`,
          );
        }

        //* Validate Copastor according family house
        if (!newFamilyHouse?.theirCopastor) {
          throw new BadRequestException(
            `Copastor was not found, verify that Family House has a co-pastor assigned`,
          );
        }

        const newCopastor = await this.copastorRepository.findOne({
          where: { id: newFamilyHouse?.theirCopastor?.id },
        });

        if (!newCopastor.status) {
          throw new BadRequestException(
            `The property status in Copastor must be "active"`,
          );
        }

        //* Validate Pastor according family house
        if (!newFamilyHouse?.theirPastor) {
          throw new BadRequestException(
            `Pastor was not found, verify that Family House has a pastor assigned`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newFamilyHouse?.theirPastor?.id },
        });

        if (!newPastor.status) {
          throw new BadRequestException(
            `The property status in Pastor must be "active"`,
          );
        }

        //* Validate Church according family house
        if (!newFamilyHouse?.theirChurch) {
          throw new BadRequestException(
            `Church was not found, verify that Family House has a church assigned`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newFamilyHouse?.theirChurch?.id },
        });

        if (!newChurch.status) {
          throw new BadRequestException(
            `The property status in Church must be "active"`,
          );
        }

        // Update and save
        const updatedDisciple = await this.discipleRepository.preload({
          id: disciple.id,
          ...updateDiscipleDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
          theirZone: newZone,
          theirFamilyHouse: newFamilyHouse,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          return await this.preacherRepository.save(updatedDisciple);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? Update and save if is same Copastor
      if (disciple.theirFamilyHouse?.id === theirFamilyHouse) {
        const updatedDisciple = await this.discipleRepository.preload({
          id: disciple.id,
          ...updateDiscipleDto,
          theirChurch: disciple.theirChurch,
          theirPastor: disciple.theirPastor,
          theirCopastor: disciple.theirCopastor,
          theirSupervisor: disciple.theirSupervisor,
          theirPreacher: disciple.theirPreacher,
          theirZone: disciple.theirZone,
          theirFamilyHouse: disciple.theirFamilyHouse,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          return await this.discipleRepository.save(updatedDisciple);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Raise Disciple level to Preacher
    if (
      disciple.roles.includes(MemberRoles.Disciple) &&
      !disciple.roles.includes(MemberRoles.Preacher) &&
      !disciple.roles.includes(MemberRoles.Treasurer) &&
      !disciple.roles.includes(MemberRoles.Copastor) &&
      !disciple.roles.includes(MemberRoles.Supervisor) &&
      !disciple.roles.includes(MemberRoles.Pastor) &&
      roles.includes(MemberRoles.Disciple) &&
      roles.includes(MemberRoles.Preacher) &&
      !roles.includes(MemberRoles.Treasurer) &&
      !roles.includes(MemberRoles.Copastor) &&
      !roles.includes(MemberRoles.Pastor) &&
      !roles.includes(MemberRoles.Supervisor) &&
      status === Status.Active
    ) {
      //* Validation new supervisor
      if (!theirSupervisor) {
        throw new NotFoundException(
          `To upgrade from disciple to preacher assign an existing supervisor id`,
        );
      }

      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: theirSupervisor },
        relations: ['theirCopastor', 'theirPastor', 'theirChurch', 'theirZone'],
      });

      if (!newSupervisor) {
        throw new NotFoundException(`Supervisor not found with id: ${id}`);
      }

      if (newSupervisor.status === Status.Inactive) {
        throw new NotFoundException(
          `The property status in Supervisor must be a "active"`,
        );
      }

      //* Validation new zone according supervisor
      if (!newSupervisor?.theirZone) {
        throw new BadRequestException(
          `Zone was not found, verify that Supervisor has a zone assigned`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: newSupervisor?.theirZone?.id },
      });

      if (newZone.status === Status.Inactive) {
        throw new NotFoundException(
          `The property status in Zone must be a "active"`,
        );
      }

      //* Validation new copastor according supervisor
      if (!newSupervisor?.theirCopastor) {
        throw new BadRequestException(
          `Copastor was not found, verify that Supervisor has a co-pastor assigned`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newSupervisor?.theirCopastor?.id },
      });

      if (newCopastor.status === Status.Inactive) {
        throw new NotFoundException(
          `The property status in Copastor must be a "active"`,
        );
      }

      //* Validation new pastor according supervisor
      if (!newSupervisor?.theirPastor) {
        throw new BadRequestException(
          `Church was not found, verify that Supervisor has a church assigned`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newSupervisor?.theirPastor?.id },
      });

      if (newPastor.status === Status.Inactive) {
        throw new NotFoundException(
          `The property status in Pastor must be a "active"`,
        );
      }

      //* Validation new church according supervisor
      if (!newSupervisor?.theirChurch) {
        throw new BadRequestException(
          `Church was not found, verify that Supervisor has a church assigned`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newSupervisor?.theirChurch?.id },
      });

      if (newChurch.status === Status.Inactive) {
        throw new NotFoundException(
          `The property status in Church must be a "active"`,
        );
      }

      // Create new instance Preacher and delete old disciple
      try {
        const newPreacher = this.preacherRepository.create({
          ...updateDiscipleDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
          theirFamilyHouse: null,
          theirZone: newZone,
          createdAt: new Date(),
          createdBy: user,
        });
        const savedPreacher = await this.preacherRepository.save(newPreacher);

        await this.discipleRepository.remove(disciple);

        return savedPreacher;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    } else {
      throw new BadRequestException(
        `You cannot level up, you must have the registry in "active" mode and the appropriate roles, review and update the registry.`,
      );
    }
  }

  //! DELETE DISCIPLE
  async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const disciple = await this.discipleRepository.findOneBy({ id });

    if (!disciple) {
      throw new NotFoundException(`Disciple with id: ${id} not exits`);
    }

    //* Update and set in Inactive on Preacher
    const updatedDisciple = await this.discipleRepository.preload({
      id: disciple.id,
      theirChurch: null,
      theirPastor: null,
      theirCopastor: null,
      theirSupervisor: null,
      theirZone: null,
      theirFamilyHouse: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    // Update and save
    try {
      await this.discipleRepository.save(updatedDisciple);
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
