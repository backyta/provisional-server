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
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: theirSupervisor },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirZone',
        'preachers',
      ],
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
      relations: ['preachers'],
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
      relations: ['preachers'],
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
      relations: ['preachers'],
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
      relations: ['preachers'],
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

        const savedPreacher = await this.preacherRepository.save(newPreacher);

        // Count and assign preachers in Zone
        const preachersInZone = [...(zone.preachers || []), savedPreacher];
        zone.preachers = preachersInZone;
        zone.numberPreachers = preachersInZone.length;

        // Count and assign preachers in Supervisor
        const preachersInSupervisor = [
          ...(supervisor.preachers || []),
          savedPreacher,
        ];
        supervisor.preachers = preachersInSupervisor;
        supervisor.numberPreachers = preachersInSupervisor.length;

        // Count and assign preachers in Copastor
        const preachersInCopastor = [
          ...(copastor.preachers || []),
          savedPreacher,
        ];
        copastor.preachers = preachersInCopastor;
        copastor.numberPreachers = preachersInCopastor.length;

        // Count and assign preachers in Pastor
        const preachersInPastor = [...(pastor.preachers || []), savedPreacher];
        pastor.preachers = preachersInPastor;
        pastor.numberPreachers = preachersInPastor.length;

        // Count and assign preachers in Church
        const preachersInChurch = [...(church.preachers || []), savedPreacher];
        church.preachers = preachersInChurch;
        church.numberPreachers = preachersInChurch.length;

        await this.zoneRepository.save(zone);
        await this.supervisorRepository.save(supervisor);
        await this.copastorRepository.save(copastor);
        await this.pastorRepository.save(pastor);
        await this.churchRepository.save(church);

        return newPreacher;
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
        roles.includes(MemberRoles.Pastor) ||
        roles.includes(MemberRoles.Supervisor) ||
        roles.includes(MemberRoles.Treasurer))
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

        // Data old Supervisor
        const oldSupervisor = await this.supervisorRepository.findOne({
          where: { id: preacher?.theirSupervisor?.id },
          relations: [
            'preachers',
            'familyHouses',
            'familyHouses.theirPreacher',
            'disciples',
            'disciples.theirPreacher',
          ],
        });

        // Data old Zone
        const oldZone = await this.zoneRepository.findOne({
          where: { id: preacher?.theirZone?.id },
          relations: [
            'preachers',
            'familyHouses',
            'familyHouses.theirPreacher',
            'disciples',
            'disciples.theirPreacher',
          ],
        });

        // Data old Copastor
        const oldCopastor = await this.copastorRepository.findOne({
          where: { id: preacher?.theirCopastor?.id },
          relations: [
            'preachers',
            'familyHouses',
            'familyHouses.theirPreacher',
            'disciples',
            'disciples.theirPreacher',
          ],
        });

        // Data old Pastor
        const oldPastor = await this.pastorRepository.findOne({
          where: { id: preacher?.theirPastor?.id },
          relations: [
            'preachers',
            'familyHouses',
            'familyHouses.theirPreacher',
            'disciples',
            'disciples.theirPreacher',
          ],
        });

        // Data old curch
        const oldChurch = await this.churchRepository.findOne({
          where: { id: preacher?.theirChurch?.id },
          relations: [
            'preachers',
            'familyHouses',
            'familyHouses.theirPreacher',
            'disciples',
            'disciples.theirPreacher',
          ],
        });

        //! Delete preacher relation and subtract amount on the old supervisor
        // Delete preacher the old supervisor according preacher
        const preachersOldSupervisor = oldSupervisor?.preachers.filter(
          (oldPreacher) => oldPreacher?.id !== preacher?.id,
        );
        oldSupervisor.preachers = preachersOldSupervisor;
        oldSupervisor.numberPreachers = preachersOldSupervisor.length;

        // Delete family houses the old supervisor according preacher
        const familyHousesOldSupervisor = oldSupervisor?.familyHouses.filter(
          (oldFamilyHouse) =>
            oldFamilyHouse?.theirPreacher?.id !== preacher?.id,
        );
        oldSupervisor.familyHouses = familyHousesOldSupervisor;
        oldSupervisor.numberFamilyHouses = familyHousesOldSupervisor.length;

        // Delete disciples the old supervisor according preacher
        const disciplesOldSupervisor = oldSupervisor?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirPreacher?.id !== preacher?.id,
        );
        oldSupervisor.disciples = disciplesOldSupervisor;
        oldSupervisor.numberDisciples = disciplesOldSupervisor.length;

        //! Delete preacher relation and subtract amount on the old zone
        // Delete preacher the old supervisor according preacher
        const preachersOldZone = oldZone?.preachers.filter(
          (oldPreacher) => oldPreacher?.id !== preacher?.id,
        );
        oldZone.preachers = preachersOldZone;
        oldZone.numberPreachers = preachersOldZone.length;

        // Delete family houses the old supervisor according preacher
        const familyHousesOldZone = oldZone?.familyHouses.filter(
          (oldFamilyHouse) =>
            oldFamilyHouse?.theirPreacher?.id !== preacher?.id,
        );
        oldZone.familyHouses = familyHousesOldZone;
        oldZone.numberFamilyHouses = familyHousesOldZone.length;

        // Delete disciples the old supervisor according preacher
        const disciplesOldZone = oldZone?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirPreacher?.id !== preacher?.id,
        );
        oldZone.disciples = disciplesOldZone;
        oldZone.numberDisciples = disciplesOldZone.length;

        //! Delete preacher relation and subtract amount on the old co-pastor
        // Delete copastors the old copastor according preacher
        const preachersOldCopastor = oldCopastor?.preachers.filter(
          (oldPreacher) => oldPreacher?.id !== preacher?.id,
        );
        oldCopastor.preachers = preachersOldCopastor;
        oldCopastor.numberPreachers = preachersOldCopastor.length;

        // Delete family houses the old copastor according preacher
        const familyHousesOldCopastor = oldCopastor?.familyHouses.filter(
          (oldFamilyHouse) =>
            oldFamilyHouse?.theirPreacher?.id !== preacher?.id,
        );
        oldCopastor.familyHouses = familyHousesOldCopastor;
        oldCopastor.numberFamilyHouses = familyHousesOldCopastor.length;

        // Delete disciples the old copastor according preacher
        const disciplesOldCopastor = oldCopastor?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirPreacher?.id !== preacher?.id,
        );
        oldCopastor.disciples = disciplesOldCopastor;
        oldCopastor.numberDisciples = disciplesOldCopastor.length;

        //! Delete preacher relation and subtract amount on the old pastor
        // Delete zones the old pastor according preacher
        const preachersOldPastor = oldPastor?.preachers.filter(
          (oldPreacher) => oldPreacher?.id !== preacher?.id,
        );
        oldPastor.preachers = preachersOldPastor;
        oldPastor.numberPreachers = preachersOldPastor.length;

        // Delete family houses the old pastor according preacher
        const familyHousesOldPastor = oldPastor?.familyHouses.filter(
          (oldFamilyHouse) =>
            oldFamilyHouse?.theirPreacher?.id !== preacher?.id,
        );
        oldPastor.familyHouses = familyHousesOldPastor;
        oldPastor.numberFamilyHouses = familyHousesOldPastor.length;

        // Delete disciples the old pastor according preacher
        const disciplesOldPastor = oldPastor?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirPreacher?.id !== preacher?.id,
        );
        oldPastor.disciples = disciplesOldPastor;
        oldPastor.numberDisciples = disciplesOldPastor.length;

        //! Delete preacher relation and subtract amount on the old church
        // Delete zones the old church according pastor
        const preachersOldChurch = oldChurch?.preachers.filter(
          (oldPreacher) => oldPreacher?.id !== preacher?.id,
        );
        oldChurch.preachers = preachersOldChurch;
        oldChurch.numberPreachers = preachersOldChurch.length;

        // Delete family houses the old church according pastor
        const familyHousesOldChurch = oldChurch?.familyHouses.filter(
          (oldFamilyHouse) =>
            oldFamilyHouse?.theirPreacher?.id !== preacher?.id,
        );
        oldChurch.familyHouses = familyHousesOldChurch;
        oldChurch.numberFamilyHouses = familyHousesOldChurch.length;

        // Delete disciples the old church according pastor
        const disciplesOldChurch = oldChurch?.disciples.filter(
          (oldDisciple) => oldDisciple?.theirPreacher?.id !== preacher?.id,
        );
        oldChurch.disciples = disciplesOldChurch;
        oldChurch.numberDisciples = disciplesOldChurch.length;

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
          const savedPreacher =
            await this.preacherRepository.save(updatedPreacher);

          await Promise.all(updateFamilyHouses);
          await Promise.all(updateDisciples);

          // TODO : supuestamente se debería calcular sus casas familiares, y disciples (subordinados y setear en )
          // TODO : zone, supervisors, y mayores, osea todo lo que se quito pasarlo aquí pero con nuevas relaciones
          // TODO : osea si se saca una casa familiar de la zona anterior se debe poner a esta pero con su nueva relación
          // TODO : osea la casa no debe tener el super anterior si no el nuevo asi como el copastor y pastor y church
          // NOTE : ver esto después de hacer la semilla

          //* Assign relations to the new supervisor, zone, copastor, pastor and new church
          const preachersInNewZone = (newZone.preachers = [
            ...(newZone.preachers || []),
            savedPreacher,
          ]);
          newZone.preachers = preachersInNewZone;
          newZone.numberPreachers = preachersInNewZone.length;

          const preachersInNewSupervisor = (newSupervisor.preachers = [
            ...(newSupervisor.preachers || []),
            savedPreacher,
          ]);
          newSupervisor.preachers = preachersInNewSupervisor;
          newSupervisor.numberPreachers = preachersInNewSupervisor.length;

          const preachersInNewCopastor = (newSupervisor.preachers = [
            ...(newSupervisor.preachers || []),
            savedPreacher,
          ]);
          newCopastor.preachers = preachersInNewCopastor;
          newCopastor.numberPreachers = preachersInNewCopastor.length;

          const preachersInNewPastor = (newPastor.preachers = [
            ...(newPastor.preachers || []),
            savedPreacher,
          ]);
          newPastor.preachers = preachersInNewPastor;
          newPastor.numberPreachers = preachersInNewPastor.length;

          const supervisorsInNewChurch = (newChurch.preachers = [
            ...(newChurch.preachers || []),
            savedPreacher,
          ]);
          newChurch.preachers = supervisorsInNewChurch;
          newChurch.numberPreachers = supervisorsInNewChurch.length;

          await this.supervisorRepository.save(oldSupervisor);
          await this.supervisorRepository.save(newSupervisor);
          await this.zoneRepository.save(oldZone);
          await this.zoneRepository.save(newZone);
          await this.copastorRepository.save(oldCopastor);
          await this.copastorRepository.save(newCopastor);
          await this.pastorRepository.save(oldPastor);
          await this.pastorRepository.save(newPastor);
          await this.churchRepository.save(oldChurch);
          await this.churchRepository.save(newChurch);

          return savedPreacher;
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

    //* Raise Preacher level to Supervisor
    if (
      preacher.roles.includes(MemberRoles.Disciple) &&
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
      status === Status.Active
    ) {
      // Validation new copastor
      const copastor = await this.copastorRepository.findOne({
        where: { id: theirCopastor },
        relations: ['theirPastor', 'theirChurch'],
      });

      if (!copastor) {
        throw new NotFoundException(`Copastor not found with id: ${id}`);
      }

      if (copastor.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Pastor must be a "Active"`,
        );
      }

      // Validation new pastor according copastor
      if (!copastor?.theirPastor) {
        throw new BadRequestException(
          `Pastor was not found, verify that Copastor has a Pastor assigned`,
        );
      }

      const pastor = await this.pastorRepository.findOne({
        where: { id: copastor?.theirPastor?.id },
        relations: ['theirChurch'],
      });

      if (pastor.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Pastor must be a "Active"`,
        );
      }

      // Validation new church according copastor
      if (!copastor?.theirChurch) {
        throw new BadRequestException(
          `Church was not found, verify that Copastor has a Church assigned`,
        );
      }

      const church = await this.churchRepository.findOne({
        where: { id: copastor?.theirChurch?.id },
        relations: ['theirMainChurch'],
      });

      if (church.status === Status.Active) {
        throw new NotFoundException(
          `The property status in Church must be a "Active"`,
        );
      }

      // Data old Copastor
      const oldSupervisor = await this.supervisorRepository.findOne({
        where: { id: preacher?.theirSupervisor?.id },
        relations: ['preachers'],
      });

      // Data old Zone
      const oldZone = await this.zoneRepository.findOne({
        where: { id: preacher?.theirZone?.id },
        relations: ['preachers'],
      });

      // Data old Pastor
      const oldCopastor = await this.copastorRepository.findOne({
        where: { id: preacher?.theirCopastor?.id },
        relations: ['preachers'],
      });

      // Data old Copastor
      const oldPastor = await this.pastorRepository.findOne({
        where: { id: preacher?.theirPastor?.id },
        relations: ['preachers'],
      });

      // Data old Church
      const oldChurch = await this.churchRepository.findOne({
        where: { id: preacher?.theirChurch?.id },
        relations: ['preachers'],
      });

      //! Delete preacher relation and subtract amount on the old supervisor
      const preachersOldSupervisor = oldPastor?.preachers.filter(
        (oldPreacher) => oldPreacher?.id !== preacher?.id,
      );
      oldSupervisor.preachers = preachersOldSupervisor;
      oldSupervisor.numberPreachers = preachersOldSupervisor.length;

      //! Delete preacher relation and subtract amount on the old zone
      const preachersOldZone = oldZone.preachers.filter(
        (oldPreacher) => oldPreacher?.id !== preacher?.id,
      );
      oldZone.preachers = preachersOldZone;
      oldZone.numberPreachers = preachersOldZone.length;

      //! Delete preacher relation and subtract amount on the old copastor
      const preachersOldCopastor = oldPastor?.preachers.filter(
        (oldPreacher) => oldPreacher?.id !== preacher?.id,
      );
      oldCopastor.preachers = preachersOldCopastor;
      oldCopastor.numberPreachers = preachersOldCopastor.length;

      //! Delete preacher relation and subtract amount on the old pastor
      const preachersOldPastor = oldPastor?.preachers.filter(
        (oldPreacher) => oldPreacher?.id !== preacher?.id,
      );
      oldPastor.preachers = preachersOldPastor;
      oldPastor.numberPreachers = preachersOldPastor.length;

      //! Delete preacher relation and subtract amount on the old church
      const preachersOldChurch = oldChurch?.preachers.filter(
        (oldPreacher) => oldPreacher?.id !== preacher?.id,
      );

      oldChurch.preachers = preachersOldChurch;
      oldChurch.numberPreachers = preachersOldChurch.length;

      // Create new instance Copastor and delete old supervisor
      try {
        const newSupervisor = this.supervisorRepository.create({
          ...updatePreacherDto,
          theirChurch: church,
          theirPastor: pastor,
          theirCopastor: copastor,
          createdAt: new Date(),
          createdBy: user,
        });

        await this.preacherRepository.remove(preacher); // onDelete subordinate entities

        await this.zoneRepository.save(oldZone);
        await this.copastorRepository.save(oldCopastor);
        await this.pastorRepository.save(oldPastor);
        await this.churchRepository.save(oldChurch);

        await this.supervisorRepository.save(newSupervisor);
        return newSupervisor;
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
      familyHouses: [],
      disciples: [],
      numberFamilyHouses: 0,
      numberDisciples: 0,
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

    //! Eliminate preacher relation (id and amount) on their supervisor, copastor, pastor and church
    // Supervisor
    const theirSupervisor = await this.supervisorRepository.findOne({
      where: { id: preacher?.theirSupervisor?.id },
      relations: ['preachers'],
    });

    const preachersInSupervisor = theirSupervisor.preachers.filter(
      (currentPreacher) => currentPreacher?.id !== preacher?.id,
    );

    theirSupervisor.preachers = preachersInSupervisor;
    theirSupervisor.numberPreachers = preachersInSupervisor.length;

    // Zone
    const theirZone = await this.zoneRepository.findOne({
      where: { id: preacher?.theirZone?.id },
      relations: ['preachers'],
    });

    const preachersInZone = theirZone.preachers.filter(
      (currentPreacher) => currentPreacher?.id !== preacher?.id,
    );

    theirZone.preachers = preachersInZone;
    theirZone.numberPreachers = preachersInZone.length;

    // Copastor
    const theirCopastor = await this.copastorRepository.findOne({
      where: { id: preacher?.theirCopastor?.id },
      relations: ['preachers'],
    });

    const preachersInCopastor = theirCopastor.preachers.filter(
      (currentPreacher) => currentPreacher?.id !== preacher?.id,
    );

    theirCopastor.preachers = preachersInCopastor;
    theirCopastor.numberPreachers = preachersInCopastor.length;

    // Pastor
    const theirPastor = await this.pastorRepository.findOne({
      where: { id: preacher?.theirPastor?.id },
      relations: ['preachers'],
    });

    const preachersInPastor = theirPastor.preachers.filter(
      (currentPreacher) => currentPreacher?.id !== preacher?.id,
    );

    theirPastor.preachers = preachersInPastor;
    theirPastor.numberPreachers = preachersInPastor.length;

    // Church
    const theirChurch = await this.churchRepository.findOne({
      where: { id: preacher?.theirChurch?.id },
      relations: ['preachers'],
    });

    const preachersInChurch = theirChurch.preachers.filter(
      (currentPreacher) => currentPreacher?.id !== preacher?.id,
    );

    theirChurch.preachers = preachersInChurch;
    theirChurch.numberPreachers = preachersInChurch.length;

    // Update and save
    try {
      await this.preacherRepository.save(updatedPreacher);

      await Promise.all(deleteSupervisorInFamilyHouses);
      await Promise.all(deleteSupervisorInDisciples);

      await this.supervisorRepository.save(theirSupervisor);
      await this.zoneRepository.save(theirZone);
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
