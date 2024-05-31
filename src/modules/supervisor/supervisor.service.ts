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
  CreateSupervisorDto,
  UpdateSupervisorDto,
} from '@/modules/supervisor/dto';

import { MemberRoles, Status } from '@/common/enums';

import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { isUUID } from 'class-validator';
import { Zone } from '@/modules/zone/entities';
import { Preacher } from '@/modules/preacher/entities';
import { FamilyHouse } from '@/modules/family-house/entities';
import { Disciple } from '@/modules/disciple/entities/';
import { PaginationDto } from '@/common/dtos';

@Injectable()
export class SupervisorService {
  private readonly logger = new Logger('CopastorService');

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

  //* CREATE SUPERVISOR
  async create(
    createSupervisorDto: CreateSupervisorDto,
    user: User,
  ): Promise<Supervisor> {
    const { roles, theirCopastor, theirPastor, isDirectRelationToPastor } =
      createSupervisorDto;

    // Validations
    if (
      !roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Supervisor)
    ) {
      throw new BadRequestException(
        `El rol "disciple" y "co-pastor" debe ser incluido`,
      );
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Preacher) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Supervisor solo se debe tener los roles "discípulo" y "supervisor"`,
      );
    }

    //? Validate and assign copastor

    //* If is direct relation to pastor is false (create with copastor)
    if (!isDirectRelationToPastor) {
      const copastor = await this.copastorRepository.findOne({
        where: { id: theirCopastor },
        relations: ['theirPastor', 'theirChurch', 'supervisors'],
      });

      if (!copastor) {
        throw new NotFoundException(
          `Not found copastor with id ${theirCopastor}`,
        );
      }

      if (!copastor.status) {
        throw new BadRequestException(
          `The property status in Copastor must be a "Active"`,
        );
      }

      //* Validate and assign pastor according copastor
      if (!copastor.theirPastor) {
        throw new NotFoundException(
          `Pastor was not found, verify that Copastor has a pastor assigned`,
        );
      }

      const pastor = await this.pastorRepository.findOne({
        where: { id: copastor?.theirPastor?.id },
        relations: ['supervisors'],
      });

      if (!pastor.status) {
        throw new BadRequestException(
          `The property status in Pastor must be "Active"`,
        );
      }

      //* Validate and assign church according copastor
      if (!copastor.theirChurch) {
        throw new NotFoundException(
          `Church was not found, verify that Copastor has a church assigned`,
        );
      }

      const church = await this.churchRepository.findOne({
        where: { id: copastor?.theirChurch?.id },
        relations: ['supervisors'],
      });

      if (!church.status) {
        throw new BadRequestException(
          `The property status in Church must be "Active"`,
        );
      }

      // Create new instance
      if (
        roles.includes(MemberRoles.Supervisor) &&
        roles.includes(MemberRoles.Disciple)
      ) {
        try {
          const newSupervisor = this.supervisorRepository.create({
            ...createSupervisorDto,
            theirChurch: church,
            theirPastor: pastor,
            theirCopastor: copastor,
            createdAt: new Date(),
            createdBy: user,
          });

          const savedSupervisor =
            await this.supervisorRepository.save(newSupervisor);

          // Count and assign supervisors in Copastor
          const supervisorsInCopastor = [
            ...(copastor.supervisors || []),
            savedSupervisor,
          ];
          copastor.supervisors = supervisorsInCopastor;
          copastor.numberSupervisors = supervisorsInCopastor.length;

          // Count and assign supervisors in Pastor
          const supervisorsInPastor = [
            ...(pastor.supervisors || []),
            savedSupervisor,
          ];
          pastor.supervisors = supervisorsInPastor;
          pastor.numberSupervisors = supervisorsInPastor.length;

          // Count and assign supervisors in Church
          const supervisorsInChurch = [
            ...(pastor.supervisors || []),
            savedSupervisor,
          ];
          church.supervisors = supervisorsInChurch;
          church.numberSupervisors = supervisorsInChurch.length;

          await this.churchRepository.save(church);
          await this.pastorRepository.save(pastor);
          await this.copastorRepository.save(copastor);

          return newSupervisor;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* If is direct relation to pastor is true (omit copastor)
    if (isDirectRelationToPastor) {
      //? Validate and assign pastor
      const pastor = await this.pastorRepository.findOne({
        where: { id: theirPastor },
        relations: ['theirChurch', 'supervisors'],
      });

      if (!pastor) {
        throw new NotFoundException(
          `Not found pastor with id ${theirCopastor}`,
        );
      }

      if (!pastor.status) {
        throw new BadRequestException(
          `The property status in Copastor must be a "Active"`,
        );
      }

      //* Validate and assign pastor according copastor
      if (!pastor.theirChurch) {
        throw new NotFoundException(
          `Church was not found, verify that Pastor has a Church assigned`,
        );
      }

      const church = await this.churchRepository.findOne({
        where: { id: pastor?.theirChurch?.id },
        relations: ['supervisors'],
      });

      if (!pastor.status) {
        throw new BadRequestException(
          `The property status in Pastor must be "Active"`,
        );
      }

      // Create new instance
      if (
        roles.includes(MemberRoles.Supervisor) &&
        roles.includes(MemberRoles.Disciple)
      ) {
        try {
          const newSupervisor = this.supervisorRepository.create({
            ...createSupervisorDto,
            theirChurch: church,
            theirPastor: pastor,
            theirCopastor: null,
            createdAt: new Date(),
            createdBy: user,
          });

          const savedSupervisor =
            await this.supervisorRepository.save(newSupervisor);

          // Count and assign supervisors in Pastor
          const supervisorsInPastor = [
            ...(pastor.supervisors || []),
            savedSupervisor,
          ];
          pastor.supervisors = supervisorsInPastor;
          pastor.numberSupervisors = supervisorsInPastor.length;

          // Count and assign supervisors in Church
          const supervisorsInChurch = [
            ...(pastor.supervisors || []),
            savedSupervisor,
          ];
          church.supervisors = supervisorsInChurch;
          church.numberSupervisors = supervisorsInChurch.length;

          await this.churchRepository.save(church);
          await this.pastorRepository.save(pastor);

          return newSupervisor;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<Supervisor[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.supervisorRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirZone',
        'theirCopastor',
        'theirPastor',
        'theirChurch',
        'disciples',
        'preachers',
        'familyHouses',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} supervisor`;
  }

  // TODO : en actualizar tmb modificar cuando ponga directo o false en relación con pastor
  //* UPDATE SUPERVISOR
  async update(
    id: string,
    updateSupervisorDto: UpdateSupervisorDto,
    user: User,
  ): Promise<Supervisor | Copastor> {
    const {
      roles,
      status,
      theirCopastor,
      theirPastor,
      isDirectRelationToPastor,
    } = updateSupervisorDto;

    // Validations
    if (!roles) {
      throw new BadRequestException(
        `Required assign roles to update the supervisor`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    // validation supervisor
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: id },
      relations: ['theirCopastor', 'theirPastor', 'theirChurch'],
    });

    if (!supervisor) {
      throw new NotFoundException(`Supervisor not found with id: ${id}`);
    }

    if (!roles.some((role) => ['disciple', 'supervisor'].includes(role))) {
      throw new BadRequestException(
        `The roles should include "disciple" and "supervisor"`,
      );
    }

    if (
      supervisor.roles.includes(MemberRoles.Supervisor) &&
      supervisor.roles.includes(MemberRoles.Disciple) &&
      !supervisor.roles.includes(MemberRoles.Preacher) &&
      !supervisor.roles.includes(MemberRoles.Copastor) &&
      !supervisor.roles.includes(MemberRoles.Pastor) &&
      !supervisor.roles.includes(MemberRoles.Treasurer) &&
      (roles.includes(MemberRoles.Copastor) ||
        roles.includes(MemberRoles.Pastor) ||
        roles.includes(MemberRoles.Preacher) ||
        roles.includes(MemberRoles.Treasurer))
    ) {
      throw new BadRequestException(
        `A lower or higher role cannot be assigned without going through the hierarchy: [preacher, supervisor, co-pastor, pastor]`,
      );
    }

    //* Update info about Supervisor
    if (
      supervisor.roles.includes(MemberRoles.Disciple) &&
      supervisor.roles.includes(MemberRoles.Supervisor) &&
      !supervisor.roles.includes(MemberRoles.Pastor) &&
      !supervisor.roles.includes(MemberRoles.Copastor) &&
      !supervisor.roles.includes(MemberRoles.Preacher) &&
      !supervisor.roles.includes(MemberRoles.Treasurer) &&
      roles.includes(MemberRoles.Disciple) &&
      roles.includes(MemberRoles.Supervisor) &&
      !roles.includes(MemberRoles.Pastor) &&
      !roles.includes(MemberRoles.Copastor) &&
      !roles.includes(MemberRoles.Preacher) &&
      !roles.includes(MemberRoles.Treasurer)
    ) {
      // Validations
      if (supervisor.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `You cannot update it to "inactive", you must delete the record`,
        );
      }

      //? Update if their Copastor is different and id direct relation to pastor is false (means require copastor)
      if (
        supervisor.theirCopastor?.id !== theirCopastor &&
        !isDirectRelationToPastor
      ) {
        // Validate copastor
        const newCopastor = await this.copastorRepository.findOne({
          where: { id: theirCopastor },
          relations: [
            'supervisors',
            'zones',
            'preachers',
            'familyHouses',
            'disciples',
          ],
        });

        if (!newCopastor) {
          throw new NotFoundException(
            `Copastor not found with id ${theirPastor}`,
          );
        }

        if (!newCopastor.status) {
          throw new BadRequestException(
            `The property status in Copastor must be "Active"`,
          );
        }

        // Validate Pastor according copastor
        if (!newCopastor.theirPastor) {
          throw new BadRequestException(
            `Pastor was not found, verify that Copastor has a Pastor assigned`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newCopastor?.theirPastor?.id },
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

        // Validate Church according copastor
        if (!newCopastor.theirChurch) {
          throw new BadRequestException(
            `Church was not found, verify that Copastor has a Church assigned`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newCopastor?.theirChurch?.id },
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
        const allZones = await this.zoneRepository.find({
          relations: [
            'theirSupervisor',
            'theirPastor',
            'theirCopastor',
            'theirChurch',
          ],
        });
        const allPreachers = await this.preacherRepository.find({
          relations: [
            'theirSupervisor',
            'theirPastor',
            'theirCopastor',
            'theirChurch',
          ],
        });
        const allFamilyHouses = await this.familyHouseRepository.find({
          relations: [
            'theirSupervisor',
            'theirPastor',
            'theirCopastor',
            'theirChurch',
          ],
        });
        const allDisciples = await this.discipleRepository.find({
          relations: [
            'theirSupervisor',
            'theirPastor',
            'theirCopastor',
            'theirChurch',
          ],
        });

        //* Update in all zones the new relations of the copastor that is updated.
        const zonesBySupervisor = allZones.filter(
          (zone) => zone.theirSupervisor?.id === supervisor?.id,
        );

        const updateZones = zonesBySupervisor.map(async (zone) => {
          await this.zoneRepository.update(zone.id, {
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: newCopastor,
          });
        });

        //* Update in all preachers the new relations of the copastor that is updated.
        const preachersBySupervisor = allPreachers.filter(
          (preacher) => preacher.theirSupervisor?.id === supervisor?.id,
        );

        const updatePreachers = preachersBySupervisor.map(async (preacher) => {
          await this.preacherRepository.update(preacher.id, {
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: newCopastor,
          });
        });

        //* Update in all family houses the new relations of the copastor that is updated.
        const familyHousesBySupervisor = allFamilyHouses.filter(
          (familyHouse) => familyHouse.theirSupervisor?.id === supervisor?.id,
        );

        const updateFamilyHouses = familyHousesBySupervisor.map(
          async (familyHouse) => {
            await this.familyHouseRepository.update(familyHouse.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
            });
          },
        );

        //* Update in all disciples the new relations of the copastor that is updated.
        const disciplesBySupervisor = allDisciples.filter(
          (disciple) => disciple.theirSupervisor?.id === supervisor?.id,
        );

        const updateDisciples = disciplesBySupervisor.map(async (disciple) => {
          await this.discipleRepository.update(disciple.id, {
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: newCopastor,
          });
        });

        // Data old Copastor
        const oldCopastor = await this.copastorRepository.findOne({
          where: { id: supervisor?.theirCopastor?.id },
          relations: [
            'supervisors',
            'zones',
            'zones.theirSupervisor',
            'preachers',
            'preachers.theirSupervisor',
            'familyHouses',
            'familyHouses.theirSupervisor',
            'disciples',
            'disciples.theirSupervisor',
          ],
        });

        // Data old Pastor
        const oldPastor = await this.pastorRepository.findOne({
          where: { id: supervisor?.theirPastor?.id },
          relations: [
            'supervisors',
            'zones',
            'zones.theirSupervisor',
            'preachers',
            'preachers.theirSupervisor',
            'familyHouses',
            'familyHouses.theirSupervisor',
            'disciples',
            'disciples.theirSupervisor',
          ],
        });

        // Data old curch
        const oldChurch = await this.churchRepository.findOne({
          where: { id: supervisor?.theirChurch?.id },
          relations: [
            'supervisors',
            'zones',
            'zones.theirSupervisor',
            'preachers',
            'preachers.theirSupervisor',
            'familyHouses',
            'familyHouses.theirSupervisor',
            'disciples',
            'disciples.theirSupervisor',
          ],
        });

        // NOTE : la zona sigue siendo la misma por eso no se necesita borrar sus relaciones.

        //! Delete supervisor relation and subtract amount on the old co-pastor
        // Delete supervisors the old copastor according supervisor
        const supervisorsOldCopastor = oldCopastor?.supervisors.filter(
          (oldSupervisor) => oldSupervisor?.id !== supervisor?.id,
        );
        oldCopastor.supervisors = supervisorsOldCopastor;
        oldCopastor.numberSupervisors = supervisorsOldCopastor.length;

        // Delete zones the old copastor according supervisor
        const zonesOldCopastor = oldCopastor?.zones.filter(
          (oldZone) => oldZone?.theirSupervisor?.id !== supervisor?.id,
        );
        oldCopastor.zones = zonesOldCopastor;
        oldCopastor.numberZones = zonesOldCopastor.length;

        // Delete preacher the old copastor according supervisor
        const preachersOldCopastor = oldCopastor?.preachers.filter(
          (oldPreacher) => oldPreacher?.theirSupervisor?.id !== supervisor?.id,
        );
        oldCopastor.preachers = preachersOldCopastor;
        oldCopastor.numberPreachers = preachersOldCopastor.length;

        // Delete family houses the old copastor according supervisor
        const familyHousesOldCopastor = oldCopastor?.familyHouses.filter(
          (oldFamilyHouse) =>
            oldFamilyHouse?.theirSupervisor?.id !== supervisor?.id,
        );
        oldCopastor.familyHouses = familyHousesOldCopastor;
        oldCopastor.numberFamilyHouses = familyHousesOldCopastor.length;

        // Delete disciples the old copastor according supervisor
        const disciplesOldCopastor = oldCopastor?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirSupervisor?.id !== supervisor?.id,
        );
        oldCopastor.disciples = disciplesOldCopastor;
        oldCopastor.numberDisciples = disciplesOldCopastor.length;

        //! Delete supervisor relation and subtract amount on the old pastor
        // Delete supervisors the old pastor according supervisor
        const supervisorsOldPastor = oldPastor?.supervisors.filter(
          (oldSupervisor) => oldSupervisor?.id !== supervisor?.id,
        );
        oldPastor.supervisors = supervisorsOldPastor;
        oldPastor.numberSupervisors = supervisorsOldPastor.length;

        // Delete zones the old pastor according supervisor
        const zonesOldPastor = oldPastor?.zones.filter(
          (oldZone) => oldZone?.theirSupervisor?.id !== supervisor?.id,
        );
        oldPastor.zones = zonesOldPastor;
        oldPastor.numberZones = zonesOldPastor.length;

        // Delete preachers the old pastor according supervisor
        const preachersOldPastor = oldPastor?.preachers.filter(
          (oldPreacher) => oldPreacher?.theirSupervisor?.id !== supervisor?.id,
        );
        oldPastor.preachers = preachersOldPastor;
        oldPastor.numberPreachers = preachersOldPastor.length;

        // Delete family houses the old pastor according supervisor
        const familyHousesOldPastor = oldPastor?.familyHouses.filter(
          (oldFamilyHouse) =>
            oldFamilyHouse?.theirSupervisor?.id !== supervisor?.id,
        );
        oldPastor.familyHouses = familyHousesOldPastor;
        oldPastor.numberFamilyHouses = familyHousesOldPastor.length;

        // Delete disciples the old pastor according supervisor
        const disciplesOldPastor = oldPastor?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirSupervisor?.id !== supervisor?.id,
        );
        oldPastor.disciples = disciplesOldPastor;
        oldPastor.numberDisciples = disciplesOldPastor.length;

        //! Delete supervisor relation and subtract amount on the old church
        // Delete supervisors the old church according supervisor
        const supervisorsOldChurch = oldChurch?.supervisors.filter(
          (oldSupervisor) => oldSupervisor?.id !== supervisor?.id,
        );
        oldChurch.supervisors = supervisorsOldChurch;
        oldChurch.numberSupervisors = supervisorsOldChurch.length;

        // Delete zones the old church according supervisor
        const zonesOldChurch = oldChurch?.zones.filter(
          (oldZone) => oldZone?.theirSupervisor?.id !== supervisor?.id,
        );
        oldChurch.zones = zonesOldChurch;
        oldChurch.numberZones = zonesOldChurch.length;

        // Delete zones the old church according supervisor
        const preachersOldChurch = oldChurch?.preachers.filter(
          (oldPreacher) => oldPreacher?.theirSupervisor?.id !== supervisor?.id,
        );
        oldChurch.preachers = preachersOldChurch;
        oldChurch.numberPreachers = preachersOldChurch.length;

        // Delete family houses the old church according supervisor
        const familyHousesOldChurch = oldChurch?.familyHouses.filter(
          (oldFamilyHouse) =>
            oldFamilyHouse?.theirSupervisor?.id !== supervisor?.id,
        );
        oldChurch.familyHouses = familyHousesOldChurch;
        oldChurch.numberFamilyHouses = familyHousesOldChurch.length;

        // Delete disciples the old church according supervisor
        const disciplesOldChurch = oldChurch?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirSupervisor?.id !== supervisor?.id,
        );
        oldChurch.disciples = disciplesOldChurch;
        oldChurch.numberDisciples = disciplesOldChurch.length;

        // Update and save
        const updatedSupervisor = await this.supervisorRepository.preload({
          id: supervisor.id,
          ...updateSupervisorDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          const savedSupervisor =
            await this.supervisorRepository.save(updatedSupervisor);

          await Promise.all(updateZones);
          await Promise.all(updatePreachers);
          await Promise.all(updateFamilyHouses);
          await Promise.all(updateDisciples);

          //* Assign relations to the new copastor, pastor and new church
          const supervisorsInNewCopastor = (newCopastor.supervisors = [
            ...(newCopastor.supervisors || []),
            savedSupervisor,
          ]);
          newCopastor.supervisors = supervisorsInNewCopastor;
          newCopastor.numberSupervisors = supervisorsInNewCopastor.length;

          const supervisorsInNewPastor = (newPastor.supervisors = [
            ...(newPastor.supervisors || []),
            savedSupervisor,
          ]);
          newPastor.supervisors = supervisorsInNewPastor;
          newPastor.numberSupervisors = supervisorsInNewPastor.length;

          const supervisorsInNewChurch = (newChurch.supervisors = [
            ...(newChurch.supervisors || []),
            savedSupervisor,
          ]);
          newChurch.supervisors = supervisorsInNewChurch;
          newChurch.numberSupervisors = supervisorsInNewChurch.length;

          await this.copastorRepository.save(oldCopastor);
          await this.copastorRepository.save(newCopastor);
          await this.pastorRepository.save(oldPastor);
          await this.pastorRepository.save(newPastor);
          await this.churchRepository.save(oldChurch);
          await this.churchRepository.save(newChurch);

          return savedSupervisor;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //! Update if Is Direction relation to pastor is true
      if (isDirectRelationToPastor) {
        // Validate pastor
        const newPastor = await this.pastorRepository.findOne({
          where: { id: theirCopastor },
          relations: [
            'copastors',
            'supervisors',
            'zones',
            'preachers',
            'familyHouses',
            'disciples',
          ],
        });

        if (!newPastor) {
          throw new NotFoundException(
            `Pastor not found with id ${theirPastor}`,
          );
        }

        if (!newPastor.status) {
          throw new BadRequestException(
            `The property status in Pastor must be "Active"`,
          );
        }

        // Validate Church according pastor
        if (!newPastor.theirChurch) {
          throw new BadRequestException(
            `Church was not found, verify that Pastor has a Church assigned`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newPastor?.theirChurch?.id },
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
        const allZones = await this.zoneRepository.find({
          relations: [
            'theirSupervisor',
            'theirPastor',
            'theirCopastor',
            'theirChurch',
          ],
        });
        const allPreachers = await this.preacherRepository.find({
          relations: [
            'theirSupervisor',
            'theirPastor',
            'theirCopastor',
            'theirChurch',
          ],
        });
        const allFamilyHouses = await this.familyHouseRepository.find({
          relations: [
            'theirSupervisor',
            'theirPastor',
            'theirCopastor',
            'theirChurch',
          ],
        });
        const allDisciples = await this.discipleRepository.find({
          relations: [
            'theirSupervisor',
            'theirPastor',
            'theirCopastor',
            'theirChurch',
          ],
        });

        //* Update in all zones the new relations of the copastor that is updated.
        const zonesBySupervisor = allZones.filter(
          (zone) => zone.theirSupervisor?.id === supervisor?.id,
        );

        const updateZones = zonesBySupervisor.map(async (zone) => {
          await this.zoneRepository.update(zone.id, {
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: null,
          });
        });

        //* Update in all preachers the new relations of the copastor that is updated.
        const preachersBySupervisor = allPreachers.filter(
          (preacher) => preacher.theirSupervisor?.id === supervisor?.id,
        );

        const updatePreachers = preachersBySupervisor.map(async (preacher) => {
          await this.preacherRepository.update(preacher.id, {
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: null,
          });
        });

        //* Update in all family houses the new relations of the copastor that is updated.
        const familyHousesBySupervisor = allFamilyHouses.filter(
          (familyHouse) => familyHouse.theirSupervisor?.id === supervisor?.id,
        );

        const updateFamilyHouses = familyHousesBySupervisor.map(
          async (familyHouse) => {
            await this.familyHouseRepository.update(familyHouse.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: null,
            });
          },
        );

        //* Update in all disciples the new relations of the copastor that is updated.
        const disciplesBySupervisor = allDisciples.filter(
          (disciple) => disciple.theirSupervisor?.id === supervisor?.id,
        );

        const updateDisciples = disciplesBySupervisor.map(async (disciple) => {
          await this.discipleRepository.update(disciple.id, {
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: null,
          });
        });

        // Data old Copastor
        const oldCopastor = await this.copastorRepository.findOne({
          where: { id: supervisor?.theirCopastor?.id },
          relations: [
            'supervisors',
            'zones',
            'zones.theirSupervisor',
            'preachers',
            'preachers.theirSupervisor',
            'familyHouses',
            'familyHouses.theirSupervisor',
            'disciples',
            'disciples.theirSupervisor',
          ],
        });

        // Data old Pastor
        const oldPastor = await this.pastorRepository.findOne({
          where: { id: supervisor?.theirPastor?.id },
          relations: [
            'supervisors',
            'zones',
            'zones.theirSupervisor',
            'preachers',
            'preachers.theirSupervisor',
            'familyHouses',
            'familyHouses.theirSupervisor',
            'disciples',
            'disciples.theirSupervisor',
          ],
        });

        // Data old curch
        const oldChurch = await this.churchRepository.findOne({
          where: { id: supervisor?.theirChurch?.id },
          relations: [
            'supervisors',
            'zones',
            'zones.theirSupervisor',
            'preachers',
            'preachers.theirSupervisor',
            'familyHouses',
            'familyHouses.theirSupervisor',
            'disciples',
            'disciples.theirSupervisor',
          ],
        });

        // NOTE : la zona sigue siendo la misma por eso no se necesita borrar sus relaciones.
        // TODO : revisar esto de las zones después
        //! Delete supervisor relation and subtract amount on the old co-pastor
        // Delete supervisors the old copastor according supervisor
        const supervisorsOldCopastor = oldCopastor?.supervisors.filter(
          (oldSupervisor) => oldSupervisor?.id !== supervisor?.id,
        );
        oldCopastor.supervisors = supervisorsOldCopastor;
        oldCopastor.numberSupervisors = supervisorsOldCopastor.length;

        // Delete zones the old copastor according supervisor
        const zonesOldCopastor = oldCopastor?.zones.filter(
          (oldZone) => oldZone?.theirSupervisor?.id !== supervisor?.id,
        );
        oldCopastor.zones = zonesOldCopastor;
        oldCopastor.numberZones = zonesOldCopastor.length;

        // Delete preacher the old copastor according supervisor
        const preachersOldCopastor = oldCopastor?.preachers.filter(
          (oldPreacher) => oldPreacher?.theirSupervisor?.id !== supervisor?.id,
        );
        oldCopastor.preachers = preachersOldCopastor;
        oldCopastor.numberPreachers = preachersOldCopastor.length;

        // Delete family houses the old copastor according supervisor
        const familyHousesOldCopastor = oldCopastor?.familyHouses.filter(
          (oldFamilyHouse) =>
            oldFamilyHouse?.theirSupervisor?.id !== supervisor?.id,
        );
        oldCopastor.familyHouses = familyHousesOldCopastor;
        oldCopastor.numberFamilyHouses = familyHousesOldCopastor.length;

        // Delete disciples the old copastor according supervisor
        const disciplesOldCopastor = oldCopastor?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirSupervisor?.id !== supervisor?.id,
        );
        oldCopastor.disciples = disciplesOldCopastor;
        oldCopastor.numberDisciples = disciplesOldCopastor.length;

        //! Delete supervisor relation and subtract amount on the old pastor
        // Delete supervisors the old pastor according supervisor
        const supervisorsOldPastor = oldPastor?.supervisors.filter(
          (oldSupervisor) => oldSupervisor?.id !== supervisor?.id,
        );
        oldPastor.supervisors = supervisorsOldPastor;
        oldPastor.numberSupervisors = supervisorsOldPastor.length;

        // Delete zones the old pastor according supervisor
        const zonesOldPastor = oldPastor?.zones.filter(
          (oldZone) => oldZone?.theirSupervisor?.id !== supervisor?.id,
        );
        oldPastor.zones = zonesOldPastor;
        oldPastor.numberZones = zonesOldPastor.length;

        // Delete preachers the old pastor according supervisor
        const preachersOldPastor = oldPastor?.preachers.filter(
          (oldPreacher) => oldPreacher?.theirSupervisor?.id !== supervisor?.id,
        );
        oldPastor.preachers = preachersOldPastor;
        oldPastor.numberPreachers = preachersOldPastor.length;

        // Delete family houses the old pastor according supervisor
        const familyHousesOldPastor = oldPastor?.familyHouses.filter(
          (oldFamilyHouse) =>
            oldFamilyHouse?.theirSupervisor?.id !== supervisor?.id,
        );
        oldPastor.familyHouses = familyHousesOldPastor;
        oldPastor.numberFamilyHouses = familyHousesOldPastor.length;

        // Delete disciples the old pastor according supervisor
        const disciplesOldPastor = oldPastor?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirSupervisor?.id !== supervisor?.id,
        );
        oldPastor.disciples = disciplesOldPastor;
        oldPastor.numberDisciples = disciplesOldPastor.length;

        //! Delete supervisor relation and subtract amount on the old church
        // Delete supervisors the old church according supervisor
        const supervisorsOldChurch = oldChurch?.supervisors.filter(
          (oldSupervisor) => oldSupervisor?.id !== supervisor?.id,
        );
        oldChurch.supervisors = supervisorsOldChurch;
        oldChurch.numberSupervisors = supervisorsOldChurch.length;

        // Delete zones the old church according supervisor
        const zonesOldChurch = oldChurch?.zones.filter(
          (oldZone) => oldZone?.theirSupervisor?.id !== supervisor?.id,
        );
        oldChurch.zones = zonesOldChurch;
        oldChurch.numberZones = zonesOldChurch.length;

        // Delete zones the old church according supervisor
        const preachersOldChurch = oldChurch?.preachers.filter(
          (oldPreacher) => oldPreacher?.theirSupervisor?.id !== supervisor?.id,
        );
        oldChurch.preachers = preachersOldChurch;
        oldChurch.numberPreachers = preachersOldChurch.length;

        // Delete family houses the old church according supervisor
        const familyHousesOldChurch = oldChurch?.familyHouses.filter(
          (oldFamilyHouse) =>
            oldFamilyHouse?.theirSupervisor?.id !== supervisor?.id,
        );
        oldChurch.familyHouses = familyHousesOldChurch;
        oldChurch.numberFamilyHouses = familyHousesOldChurch.length;

        // Delete disciples the old church according supervisor
        const disciplesOldChurch = oldChurch?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirSupervisor?.id !== supervisor?.id,
        );
        oldChurch.disciples = disciplesOldChurch;
        oldChurch.numberDisciples = disciplesOldChurch.length;

        // Update and save
        const updatedSupervisor = await this.supervisorRepository.preload({
          id: supervisor.id,
          ...updateSupervisorDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: null,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          const savedSupervisor =
            await this.supervisorRepository.save(updatedSupervisor);

          await Promise.all(updateZones);
          await Promise.all(updatePreachers);
          await Promise.all(updateFamilyHouses);
          await Promise.all(updateDisciples);

          //* Assign relations to the new pastor and new church
          const supervisorsInNewPastor = (newPastor.supervisors = [
            ...(newPastor.supervisors || []),
            savedSupervisor,
          ]);
          newPastor.supervisors = supervisorsInNewPastor;
          newPastor.numberSupervisors = supervisorsInNewPastor.length;

          const supervisorsInNewChurch = (newChurch.supervisors = [
            ...(newChurch.supervisors || []),
            savedSupervisor,
          ]);
          newChurch.supervisors = supervisorsInNewChurch;
          newChurch.numberSupervisors = supervisorsInNewChurch.length;

          await this.copastorRepository.save(oldCopastor);
          await this.copastorRepository.save(newPastor);
          await this.pastorRepository.save(oldPastor);
          await this.pastorRepository.save(newPastor);
          await this.churchRepository.save(oldChurch);
          await this.churchRepository.save(newChurch);

          return savedSupervisor;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
      // TODO : seguir con indices y semillas
      //? Update and save if is same Copastor
      if (
        supervisor.theirCopastor?.id === theirCopastor &&
        !isDirectRelationToPastor
      ) {
        const updatedSupervisor = await this.supervisorRepository.preload({
          id: supervisor.id,
          ...updateSupervisorDto,
          theirChurch: supervisor.theirChurch,
          theirPastor: supervisor.theirPastor,
          theirCopastor: supervisor.theirCopastor,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          return await this.supervisorRepository.save(updatedSupervisor);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Raise Supervisor level to Co-pastor
    if (
      supervisor.roles.includes(MemberRoles.Disciple) &&
      supervisor.roles.includes(MemberRoles.Supervisor) &&
      !supervisor.roles.includes(MemberRoles.Treasurer) &&
      !supervisor.roles.includes(MemberRoles.Copastor) &&
      !supervisor.roles.includes(MemberRoles.Preacher) &&
      !supervisor.roles.includes(MemberRoles.Pastor) &&
      roles.includes(MemberRoles.Disciple) &&
      roles.includes(MemberRoles.Copastor) &&
      !roles.includes(MemberRoles.Treasurer) &&
      !roles.includes(MemberRoles.Supervisor) &&
      !roles.includes(MemberRoles.Pastor) &&
      !roles.includes(MemberRoles.Preacher) &&
      status === Status.Active
    ) {
      // Validation new pastor
      const pastor = await this.pastorRepository.findOne({
        where: { id: theirPastor },
        relations: ['theirChurch'],
      });

      if (!pastor) {
        throw new NotFoundException(`Pastor not found with id: ${id}`);
      }

      if (pastor.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Pastor must be a "Active"`,
        );
      }

      // Validation new church according pastor
      if (!pastor?.theirChurch) {
        throw new BadRequestException(
          `Church was not found, verify that Pastor has a Church assigned`,
        );
      }

      const church = await this.churchRepository.findOne({
        where: { id: pastor?.theirChurch?.id },
        relations: ['theirMainChurch'],
      });

      if (church.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Church must be a "Active"`,
        );
      }

      // Data old Copastor
      const oldPastor = await this.pastorRepository.findOne({
        where: { id: supervisor?.theirPastor?.id },
        relations: ['supervisors'],
      });

      // Data old Pastor
      const oldCopastor = await this.copastorRepository.findOne({
        where: { id: supervisor?.theirCopastor?.id },
        relations: ['supervisors'],
      });

      // Data old Church
      const oldChurch = await this.churchRepository.findOne({
        where: { id: supervisor?.theirChurch?.id },
        relations: ['supervisors'],
      });

      //! Delete supervisor relation and subtract amount on the old copastor
      const supervisorsOldCopastor = oldPastor?.supervisors.filter(
        (oldSupervisor) => oldSupervisor?.id !== supervisor?.id,
      );
      oldCopastor.supervisors = supervisorsOldCopastor;
      oldCopastor.numberSupervisors = supervisorsOldCopastor.length;

      //! Delete supervisor relation and subtract amount on the old pastor
      const supervisorsOldPastor = oldPastor?.supervisors.filter(
        (oldSupervisor) => oldSupervisor?.id !== supervisor?.id,
      );
      oldPastor.supervisors = supervisorsOldPastor;
      oldPastor.numberSupervisors = supervisorsOldPastor.length;

      //! Delete supervisor relation and subtract amount on the old church
      const copastorsOldChurch = oldChurch?.supervisors.filter(
        (oldCopastor) => oldCopastor?.id !== supervisor?.id,
      );

      oldChurch.supervisors = copastorsOldChurch;
      oldChurch.numberSupervisors = copastorsOldChurch.length;

      // Create new instance Copastor and delete old supervisor
      try {
        const newCopastor = this.copastorRepository.create({
          ...updateSupervisorDto,
          theirChurch: church,
          theirPastor: pastor,
          createdAt: new Date(),
          createdBy: user,
        });

        await this.supervisorRepository.remove(supervisor); // onDelete subordinate entities

        await this.copastorRepository.save(oldCopastor);
        await this.pastorRepository.save(oldPastor);
        await this.churchRepository.save(oldChurch);

        await this.copastorRepository.save(newCopastor);
        return newCopastor;
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

    const supervisor = await this.supervisorRepository.findOneBy({ id });

    if (!supervisor) {
      throw new NotFoundException(`Supervisor with id: ${id} not exits`);
    }

    //* Update and set in Inactive on Supervisor
    const updatedSupervisor = await this.supervisorRepository.preload({
      id: supervisor.id,
      theirChurch: null,
      theirPastor: null,
      theirCopastor: null,
      preachers: [],
      familyHouses: [],
      disciples: [],
      numberZones: 0,
      numberPreachers: 0,
      numberFamilyHouses: 0,
      numberDisciples: 0,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    // Update and set to null relationships in Zones (who have same Supervisor)
    const allZones = await this.zoneRepository.find({
      relations: ['theirSupervisor'],
    });
    const zonesBySupervisor = allZones.filter(
      (zone) => zone.theirSupervisor?.id === supervisor?.id,
    );

    const deleteSupervisorInZones = zonesBySupervisor.map(async (zone) => {
      await this.zoneRepository.update(zone?.id, {
        theirSupervisor: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Preacher (who have same Supervisor)
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirSupervisor'],
    });
    const preachersBySupervisor = allPreachers.filter(
      (preacher) => preacher.theirSupervisor?.id === supervisor?.id,
    );

    const deleteSupervisorInPreachers = preachersBySupervisor.map(
      async (preacher) => {
        await this.preacherRepository.update(preacher?.id, {
          theirSupervisor: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Family House (who have same Supervisor)
    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirSupervisor'],
    });
    const familyHousesBySupervisor = allFamilyHouses.filter(
      (familyHome) => familyHome.theirSupervisor?.id === supervisor?.id,
    );

    const deleteSupervisorInFamilyHouses = familyHousesBySupervisor.map(
      async (familyHome) => {
        await this.familyHouseRepository.update(familyHome.id, {
          theirSupervisor: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Disciple, all those (who have the same Supervisor).
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirSupervisor'],
    });

    const disciplesBySupervisor = allDisciples.filter(
      (disciple) => disciple.theirSupervisor?.id === supervisor.id,
    );

    const deleteSupervisorInDisciples = disciplesBySupervisor.map(
      async (disciple) => {
        await this.discipleRepository.update(disciple?.id, {
          theirSupervisor: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    //! Eliminate supervisor relation (id and amount) on their copastor, pastor and church
    // Copastor
    const theirCopastor = await this.copastorRepository.findOne({
      where: { id: supervisor?.theirCopastor?.id },
      relations: ['supervisors'],
    });

    const supervisorsInCopastor = theirCopastor.supervisors.filter(
      (currentSupervisor) => currentSupervisor?.id !== supervisor?.id,
    );

    theirCopastor.supervisors = supervisorsInCopastor;
    theirCopastor.numberSupervisors = supervisorsInCopastor.length;

    // Pastor
    const theirPastor = await this.pastorRepository.findOne({
      where: { id: supervisor?.theirPastor?.id },
      relations: ['supervisors'],
    });

    const supervisorsInPastor = theirPastor.supervisors.filter(
      (currentSupervisor) => currentSupervisor?.id !== supervisor?.id,
    );

    theirPastor.supervisors = supervisorsInPastor;
    theirPastor.numberSupervisors = supervisorsInPastor.length;

    // Church
    const theirChurch = await this.churchRepository.findOne({
      where: { id: supervisor?.theirChurch?.id },
      relations: ['supervisors'],
    });

    const supervisorsInChurch = theirChurch.supervisors.filter(
      (currentSupervisor) => currentSupervisor?.id !== supervisor?.id,
    );

    theirChurch.supervisors = supervisorsInChurch;
    theirChurch.numberCopastors = supervisorsInChurch.length;

    // Update and save
    try {
      await this.supervisorRepository.save(updatedSupervisor);
      await Promise.all(deleteSupervisorInZones);
      await Promise.all(deleteSupervisorInPreachers);
      await Promise.all(deleteSupervisorInFamilyHouses);
      await Promise.all(deleteSupervisorInDisciples);

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
