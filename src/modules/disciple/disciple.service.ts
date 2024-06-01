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
import { MemberRoles, Status } from '@/common/enums';
import { User } from '@/modules/user/entities';
import { Disciple } from '@/modules/disciple/entities';
import { isUUID } from 'class-validator';
import { PaginationDto } from '@/common/dtos';

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

        return await this.discipleRepository.save(newDisciple);

        // Count and assign disciples in Family House
        // const disciplesInFamilyHouse = [
        //   ...(familyHouse.disciples || []),
        //   savedDisciple,
        // ];
        // familyHouse.disciples = disciplesInFamilyHouse;
        // familyHouse.numberDisciples = disciplesInFamilyHouse.length;

        // // Count and assign disciples in Preacher
        // const disciplesInPreacher = [
        //   ...(preacher.disciples || []),
        //   savedDisciple,
        // ];
        // preacher.disciples = disciplesInPreacher;
        // preacher.numberDisciples = disciplesInPreacher.length;

        // // Count and assign disciples in Zone
        // const disciplesInZone = [...(zone.disciples || []), savedDisciple];
        // zone.disciples = disciplesInZone;
        // zone.numberDisciples = disciplesInZone.length;

        // // Count and assign disciples in Supervisor
        // const disciplesInSupervisor = [
        //   ...(supervisor.disciples || []),
        //   savedDisciple,
        // ];
        // supervisor.disciples = disciplesInSupervisor;
        // supervisor.numberDisciples = disciplesInSupervisor.length;

        // // Count and assign disciples in Copastor
        // const disciplesInCopastor = [
        //   ...(copastor.disciples || []),
        //   savedDisciple,
        // ];
        // copastor.disciples = disciplesInCopastor;
        // copastor.numberDisciples = disciplesInCopastor.length;

        // // Count and assign disciples in Pastor
        // const disciplesInPastor = [...(pastor.disciples || []), savedDisciple];
        // pastor.disciples = disciplesInPastor;
        // pastor.numberDisciples = disciplesInPastor.length;

        // // Count and assign disciples in Church
        // const disciplesInChurch = [...(church.disciples || []), savedDisciple];
        // church.disciples = disciplesInChurch;
        // church.numberDisciples = disciplesInChurch.length;

        // await this.familyHouseRepository.save(familyHouse);
        // await this.preacherRepository.save(preacher);
        // await this.zoneRepository.save(zone);
        // await this.supervisorRepository.save(supervisor);
        // await this.copastorRepository.save(copastor);
        // await this.pastorRepository.save(pastor);
        // await this.churchRepository.save(church);

        // return newDisciple;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<Disciple[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.discipleRepository.find({
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
        'theirFamilyHouse',
        'theirPreacher',
        'theirSupervisor',
        'theirZone',
        'theirCopastor',
        'theirPastor',
        'theirChurch',
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
        roles.includes(MemberRoles.Supervisor) ||
        roles.includes(MemberRoles.Preacher) ||
        roles.includes(MemberRoles.Treasurer))
    ) {
      throw new BadRequestException(
        `A lower or higher role cannot be assigned without going through the hierarchy: [disciple, preacher, supervisor, co-pastor, pastor]`,
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
        const newFamilyHouse = await this.familyHouseRepository.findOne({
          where: { id: theirFamilyHouse },
          relations: [
            'theirPreacher',
            'theirZone',
            'theirSupervisor',
            'theirCopastor',
            'theirPastor',
            'theirChurch',
          ],
        });

        if (!newFamilyHouse) {
          throw new NotFoundException(
            `Family House not found with id ${theirFamilyHouse}`,
          );
        }

        if (!newFamilyHouse.status) {
          throw new BadRequestException(
            `The property status in Copastor must be "Active"`,
          );
        }

        //* Validate Preacher according family house
        if (!newFamilyHouse.theirPreacher) {
          throw new BadRequestException(
            `Preacher was not found, verify that Family House has a Preacher assigned`,
          );
        }

        const newPreacher = await this.preacherRepository.findOne({
          where: { id: newFamilyHouse?.theirPreacher?.id },
          relations: ['disciples'],
        });

        if (!newPreacher.status) {
          throw new BadRequestException(
            `The property status in Preacher must be "Active"`,
          );
        }

        //* Validate Supervisor according family house
        if (!newFamilyHouse.theirSupervisor) {
          throw new BadRequestException(
            `Supervisor was not found, verify that Family House has a Supervisor assigned`,
          );
        }

        const newSupervisor = await this.supervisorRepository.findOne({
          where: { id: newFamilyHouse?.theirSupervisor?.id },
          relations: ['disciples'],
        });

        if (!newSupervisor.status) {
          throw new BadRequestException(
            `The property status in Supervisor must be "Active"`,
          );
        }

        //* Validate Zone according family house
        if (!newFamilyHouse.theirZone) {
          throw new BadRequestException(
            `Zone was not found, verify that Family House has a Zone assigned`,
          );
        }

        const newZone = await this.zoneRepository.findOne({
          where: { id: newFamilyHouse?.theirZone?.id },
          relations: ['disciples'],
        });

        if (!newZone.status) {
          throw new BadRequestException(
            `The property status in Zone must be "Active"`,
          );
        }

        //* Validate Copastor according family house
        if (!newFamilyHouse.theirCopastor) {
          throw new BadRequestException(
            `Copastor was not found, verify that Family House has a Copastor assigned`,
          );
        }

        const newCopastor = await this.copastorRepository.findOne({
          where: { id: newFamilyHouse?.theirCopastor?.id },
          relations: ['disciples'],
        });

        if (!newCopastor.status) {
          throw new BadRequestException(
            `The property status in Copastor must be "Active"`,
          );
        }

        //* Validate Pastor according family house
        if (!newFamilyHouse.theirPastor) {
          throw new BadRequestException(
            `Pastor was not found, verify that Family House has a Pastor assigned`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newFamilyHouse?.theirPastor?.id },
          relations: ['disciples'],
        });

        if (!newPastor.status) {
          throw new BadRequestException(
            `The property status in Pastor must be "Active"`,
          );
        }

        //* Validate Church according family house
        if (!newFamilyHouse.theirChurch) {
          throw new BadRequestException(
            `Church was not found, verify that Family House has a Church assigned`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newFamilyHouse?.theirChurch?.id },
          relations: ['disciples'],
        });

        if (!newChurch.status) {
          throw new BadRequestException(
            `The property status in Church must be "Active"`,
          );
        }

        //? Data old relations
        // Data old Family House
        // const oldFamilyHouse = await this.familyHouseRepository.findOne({
        //   where: { id: disciple?.theirFamilyHouse?.id },
        //   relations: ['disciples'],
        // });

        // // Data old Preacher
        // const oldPreacher = await this.preacherRepository.findOne({
        //   where: { id: disciple?.theirPreacher?.id },
        //   relations: ['disciples'],
        // });

        // // Data old Supervisor
        // const oldSupervisor = await this.supervisorRepository.findOne({
        //   where: { id: disciple?.theirSupervisor?.id },
        //   relations: ['disciples'],
        // });

        // // Data old Zone
        // const oldZone = await this.zoneRepository.findOne({
        //   where: { id: disciple?.theirZone?.id },
        //   relations: ['disciples'],
        // });

        // // Data old Copastor
        // const oldCopastor = await this.copastorRepository.findOne({
        //   where: { id: disciple?.theirCopastor?.id },
        //   relations: ['disciples'],
        // });

        // // Data old Pastor
        // const oldPastor = await this.pastorRepository.findOne({
        //   where: { id: disciple?.theirPastor?.id },
        //   relations: ['disciples'],
        // });

        // // Data old Curch
        // const oldChurch = await this.churchRepository.findOne({
        //   where: { id: disciple?.theirChurch?.id },
        //   relations: ['disciples'],
        // });

        // //! Delete disciple relation and subtract amount on the old family house
        // // Filter disciples the old family house
        // const disciplesOldFamilyHouse = oldFamilyHouse?.disciples.filter(
        //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
        // );
        // oldFamilyHouse.disciples = disciplesOldFamilyHouse;
        // oldFamilyHouse.numberDisciples = disciplesOldFamilyHouse.length;

        // //! Delete disciple relation and subtract amount on the old preacher
        // // Filter disciples the old preacher
        // const disciplesOldPreacher = oldPreacher?.disciples.filter(
        //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
        // );
        // oldPreacher.disciples = disciplesOldPreacher;
        // oldPreacher.numberDisciples = disciplesOldPreacher.length;

        // //! Delete disciple relation and subtract amount on the old supervisor
        // // Filter disciples the old supervisor
        // const disciplesOldSupervisor = oldSupervisor?.disciples.filter(
        //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
        // );
        // oldSupervisor.disciples = disciplesOldSupervisor;
        // oldSupervisor.numberDisciples = disciplesOldSupervisor.length;

        // //! Delete disciple relation and subtract amount on the old zone
        // // Filter disciples the old zone
        // const disciplesOldZone = oldZone?.disciples.filter(
        //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
        // );
        // oldZone.disciples = disciplesOldZone;
        // oldZone.numberDisciples = disciplesOldZone.length;

        // //! Delete disciple relation and subtract amount on the old co-pastor
        // // Filter disciples the old copastor
        // const disciplesOldCopastor = oldCopastor?.disciples.filter(
        //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
        // );
        // oldCopastor.disciples = disciplesOldCopastor;
        // oldCopastor.numberDisciples = disciplesOldCopastor.length;

        // //! Delete disciple relation and subtract amount on the old pastor
        // // Filter disciples the old pastor
        // const disciplesOldPastor = oldPastor?.disciples.filter(
        //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
        // );
        // oldPastor.disciples = disciplesOldPastor;
        // oldPastor.numberDisciples = disciplesOldPastor.length;

        // //! Delete disciple relation and subtract amount on the old church
        // // Filter disciples the old church
        // const disciplesOldChurch = oldChurch?.disciples.filter(
        //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
        // );
        // oldChurch.disciples = disciplesOldChurch;
        // oldChurch.numberDisciples = disciplesOldChurch.length;

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

          //* Assign relations to the new family house, preacher supervisor, zone, copastor, pastor and new church
          // Family house
          // const disciplesInNewFamilyHouse = (newFamilyHouse.disciples = [
          //   ...(newFamilyHouse.disciples || []),
          //   savedDisciple,
          // ]);
          // newFamilyHouse.disciples = disciplesInNewFamilyHouse;
          // newFamilyHouse.numberDisciples = disciplesInNewFamilyHouse.length;

          // // Preacher
          // const disciplesInNewPreacher = (newPreacher.disciples = [
          //   ...(newPreacher.disciples || []),
          //   savedDisciple,
          // ]);
          // newPreacher.disciples = disciplesInNewPreacher;
          // newPreacher.numberDisciples = disciplesInNewPreacher.length;

          // // Zone
          // const disciplesInNewZone = (newZone.disciples = [
          //   ...(newZone.disciples || []),
          //   savedDisciple,
          // ]);
          // newZone.disciples = disciplesInNewZone;
          // newZone.numberDisciples = disciplesInNewZone.length;

          // // Supervisor
          // const disciplesInNewSupervisor = (newFamilyHouse.disciples = [
          //   ...(newFamilyHouse.disciples || []),
          //   savedDisciple,
          // ]);
          // newFamilyHouse.disciples = disciplesInNewSupervisor;
          // newFamilyHouse.numberDisciples = disciplesInNewSupervisor.length;

          // // Copastor
          // const disciplesInNewCopastor = (newFamilyHouse.disciples = [
          //   ...(newFamilyHouse.disciples || []),
          //   savedDisciple,
          // ]);
          // newCopastor.disciples = disciplesInNewCopastor;
          // newCopastor.numberDisciples = disciplesInNewCopastor.length;

          // // Pastor
          // const disciplesInNewPastor = (newPastor.disciples = [
          //   ...(newPastor.disciples || []),
          //   savedDisciple,
          // ]);
          // newPastor.disciples = disciplesInNewPastor;
          // newPastor.numberDisciples = disciplesInNewPastor.length;

          // // Church
          // const disciplesInNewChurch = (newChurch.disciples = [
          //   ...(newChurch.disciples || []),
          //   savedDisciple,
          // ]);
          // newChurch.disciples = disciplesInNewChurch;
          // newChurch.numberDisciples = disciplesInNewChurch.length;

          // await this.familyHouseRepository.save(oldFamilyHouse);
          // await this.familyHouseRepository.save(newFamilyHouse);
          // await this.preacherRepository.save(oldPreacher);
          // await this.preacherRepository.save(newPreacher);
          // await this.supervisorRepository.save(oldSupervisor);
          // await this.supervisorRepository.save(newSupervisor);
          // await this.zoneRepository.save(oldZone);
          // await this.zoneRepository.save(newZone);
          // await this.copastorRepository.save(oldCopastor);
          // await this.copastorRepository.save(newCopastor);
          // await this.pastorRepository.save(oldPastor);
          // await this.pastorRepository.save(newPastor);
          // await this.churchRepository.save(oldChurch);
          // await this.churchRepository.save(newChurch);

          // return savedDisciple;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? Update and save if is same Copastor
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
      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: theirSupervisor },
        relations: ['theirCopastor', 'theirPastor', 'theirChurch'],
      });

      if (!newSupervisor) {
        throw new NotFoundException(`Supervisor not found with id: ${id}`);
      }

      if (newSupervisor.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Pastor must be a "Active"`,
        );
      }

      //* Validation new zone according supervisor
      if (!newSupervisor?.theirZone) {
        throw new BadRequestException(
          `Zone was not found, verify that Supervisor has a Zone assigned`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: newSupervisor?.theirZone?.id },
        relations: ['theirSupervisor', 'theirPastor', 'theirChurch'],
      });

      if (newZone.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Zone must be a "Active"`,
        );
      }

      //* Validation new copastor according supervisor
      if (!newSupervisor?.theirCopastor) {
        throw new BadRequestException(
          `Copastor was not found, verify that Supervisor has a Copastor assigned`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newSupervisor?.theirCopastor?.id },
        relations: ['theirPastor', 'theirChurch'],
      });

      if (newCopastor.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Copastor must be a "Active"`,
        );
      }

      //* Validation new pastor according supervisor
      if (!newSupervisor?.theirPastor) {
        throw new BadRequestException(
          `Church was not found, verify that Supervisor has a Church assigned`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newSupervisor?.theirPastor?.id },
        relations: ['theirChurch'],
      });

      if (newPastor.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Pastor must be a "Active"`,
        );
      }

      //* Validation new church according supervisor
      if (!newSupervisor?.theirChurch) {
        throw new BadRequestException(
          `Church was not found, verify that Supervisor has a Church assigned`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newSupervisor?.theirChurch?.id },
        relations: ['theirMainChurch'],
      });

      if (newChurch.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Church must be a "Active"`,
        );
      }

      // Data old Family house
      // const oldFamilyHouse = await this.familyHouseRepository.findOne({
      //   where: { id: disciple?.theirFamilyHouse?.id },
      //   relations: ['disciples'],
      // });

      // // Data old Preacher
      // const oldPreacher = await this.preacherRepository.findOne({
      //   where: { id: disciple?.theirPreacher?.id },
      //   relations: ['disciples'],
      // });

      // // Data old Copastor
      // const oldSupervisor = await this.supervisorRepository.findOne({
      //   where: { id: disciple?.theirSupervisor?.id },
      //   relations: ['disciples'],
      // });

      // // Data old Zone
      // const oldZone = await this.zoneRepository.findOne({
      //   where: { id: disciple?.theirZone?.id },
      //   relations: ['disciples'],
      // });

      // // Data old Pastor
      // const oldCopastor = await this.copastorRepository.findOne({
      //   where: { id: disciple?.theirCopastor?.id },
      //   relations: ['disciples'],
      // });

      // // Data old Copastor
      // const oldPastor = await this.pastorRepository.findOne({
      //   where: { id: disciple?.theirPastor?.id },
      //   relations: ['disciples'],
      // });

      // // Data old Church
      // const oldChurch = await this.churchRepository.findOne({
      //   where: { id: disciple?.theirChurch?.id },
      //   relations: ['disciples'],
      // });

      // //! Delete disciple relation and subtract amount on the old family house
      // const disciplesOldFamilyHouse = oldFamilyHouse?.disciples.filter(
      //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
      // );
      // oldFamilyHouse.disciples = disciplesOldFamilyHouse;
      // oldFamilyHouse.numberDisciples = disciplesOldFamilyHouse.length;

      // //! Delete disciple relation and subtract amount on the old preacher
      // const disciplesOldPreacher = oldPreacher?.disciples.filter(
      //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
      // );
      // oldPreacher.disciples = disciplesOldPreacher;
      // oldPreacher.numberDisciples = disciplesOldPreacher.length;

      // //! Delete disciple relation and subtract amount on the old supervisor
      // const disciplesOldSupervisor = oldPastor?.disciples.filter(
      //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
      // );
      // oldSupervisor.disciples = disciplesOldSupervisor;
      // oldSupervisor.numberDisciples = disciplesOldSupervisor.length;

      // //! Delete disciple relation and subtract amount on the old zone
      // const disciplesOldZone = oldZone.disciples.filter(
      //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
      // );
      // oldZone.disciples = disciplesOldZone;
      // oldZone.numberDisciples = disciplesOldZone.length;

      // //! Delete disciple relation and subtract amount on the old copastor
      // const disciplesOldCopastor = oldPastor?.disciples.filter(
      //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
      // );
      // oldCopastor.disciples = disciplesOldCopastor;
      // oldCopastor.numberDisciples = disciplesOldCopastor.length;

      // //! Delete disciple relation and subtract amount on the old pastor
      // const disciplesOldPastor = oldPastor?.disciples.filter(
      //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
      // );
      // oldPastor.disciples = disciplesOldPastor;
      // oldPastor.numberDisciples = disciplesOldPastor.length;

      // //! Delete disciple relation and subtract amount on the old church
      // const disciplesOldChurch = oldChurch?.disciples.filter(
      //   (oldDisciple) => oldDisciple?.id !== disciple?.id,
      // );

      // oldChurch.disciples = disciplesOldChurch;
      // oldChurch.numberDisciples = disciplesOldChurch.length;

      // Create new instance Copastor and delete old supervisor
      try {
        const newPreacher = this.preacherRepository.create({
          ...updateDiscipleDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
          theirZone: newZone,
          createdAt: new Date(),
          createdBy: user,
        });

        await this.discipleRepository.remove(disciple);

        // await this.preacherRepository.save(oldPreacher);
        // await this.zoneRepository.save(oldZone);
        // await this.supervisorRepository.save(oldSupervisor);
        // await this.copastorRepository.save(oldCopastor);
        // await this.pastorRepository.save(oldPastor);
        // await this.churchRepository.save(oldChurch);

        return this.preacherRepository.save(newPreacher);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    } else {
      throw new BadRequestException(
        `You cannot level up, you must have the "Active"`,
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

    //! Eliminate disciple relation (id and amount) on their family house, zone, preacher, supervisor, copastor, pastor and church
    // Family House
    // const theirFamilyHouse = await this.familyHouseRepository.findOne({
    //   where: { id: disciple?.theirFamilyHouse?.id },
    //   relations: ['disciples'],
    // });

    // const disciplesInFamilyHouse = theirFamilyHouse.disciples.filter(
    //   (currentDisciple) => currentDisciple?.id !== disciple?.id,
    // );

    // theirFamilyHouse.disciples = disciplesInFamilyHouse;
    // theirFamilyHouse.numberDisciples = disciplesInFamilyHouse.length;

    // // Preacher
    // const theirPreacher = await this.preacherRepository.findOne({
    //   where: { id: disciple?.theirPreacher?.id },
    //   relations: ['disciples'],
    // });

    // const disciplesInPreacher = theirPreacher.disciples.filter(
    //   (currentDisciple) => currentDisciple?.id !== disciple?.id,
    // );

    // theirPreacher.disciples = disciplesInPreacher;
    // theirPreacher.numberDisciples = disciplesInPreacher.length;

    // // Supervisor
    // const theirSupervisor = await this.supervisorRepository.findOne({
    //   where: { id: disciple?.theirSupervisor?.id },
    //   relations: ['disciples'],
    // });

    // const preachersInSupervisor = theirSupervisor.disciples.filter(
    //   (currentDisciple) => currentDisciple?.id !== disciple?.id,
    // );

    // theirSupervisor.disciples = preachersInSupervisor;
    // theirSupervisor.numberDisciples = preachersInSupervisor.length;

    // // Zone
    // const theirZone = await this.zoneRepository.findOne({
    //   where: { id: disciple?.theirZone?.id },
    //   relations: ['disciples'],
    // });

    // const preachersInZone = theirZone.disciples.filter(
    //   (currentDisciple) => currentDisciple?.id !== disciple?.id,
    // );

    // theirZone.disciples = preachersInZone;
    // theirZone.numberDisciples = preachersInZone.length;

    // // Copastor
    // const theirCopastor = await this.copastorRepository.findOne({
    //   where: { id: disciple?.theirCopastor?.id },
    //   relations: ['disciples'],
    // });

    // const preachersInCopastor = theirCopastor.disciples.filter(
    //   (currentDisciple) => currentDisciple?.id !== disciple?.id,
    // );

    // theirCopastor.disciples = preachersInCopastor;
    // theirCopastor.numberDisciples = preachersInCopastor.length;

    // // Pastor
    // const theirPastor = await this.pastorRepository.findOne({
    //   where: { id: disciple?.theirPastor?.id },
    //   relations: ['disciples'],
    // });

    // const preachersInPastor = theirPastor.disciples.filter(
    //   (currentDisciple) => currentDisciple?.id !== disciple?.id,
    // );

    // theirPastor.disciples = preachersInPastor;
    // theirPastor.numberDisciples = preachersInPastor.length;

    // // Church
    // const theirChurch = await this.churchRepository.findOne({
    //   where: { id: disciple?.theirChurch?.id },
    //   relations: ['disciples'],
    // });

    // const preachersInChurch = theirChurch.disciples.filter(
    //   (currentDisciple) => currentDisciple?.id !== disciple?.id,
    // );

    // theirChurch.disciples = preachersInChurch;
    // theirChurch.numberDisciples = preachersInChurch.length;

    // Update and save
    try {
      await this.discipleRepository.save(updatedDisciple);

      // await this.familyHouseRepository.save(theirFamilyHouse);
      // await this.preacherRepository.save(theirPreacher);
      // await this.supervisorRepository.save(theirSupervisor);
      // await this.zoneRepository.save(theirZone);
      // await this.copastorRepository.save(theirCopastor);
      // await this.pastorRepository.save(theirPastor);
      // await this.churchRepository.save(theirChurch);
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
