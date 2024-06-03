import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { MemberRoles, Status } from '@/common/enums';

import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';

import { CreateCopastorDto, UpdateCopastorDto } from '@/modules/copastor/dto';
import { Copastor } from '@/modules/copastor/entities';
import { isUUID } from 'class-validator';
import { Supervisor } from '@/modules/supervisor/entities';
import { Zone } from '@/modules/zone/entities';
import { Preacher } from '@/modules/preacher/entities';
import { FamilyHouse } from '@/modules/family-house/entities';
import { Disciple } from '@/modules/disciple/entities/';
import { PaginationDto } from '@/common/dtos';

@Injectable()
export class CopastorService {
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

  //* CREATE COPASTOR
  async create(
    createCopastorDto: CreateCopastorDto,
    user: User,
  ): Promise<Copastor> {
    const { roles, theirPastor } = createCopastorDto;

    // Validations
    if (
      !roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Copastor)
    ) {
      throw new BadRequestException(
        `El rol "disciple" y "co-pastor" debe ser incluido`,
      );
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Supervisor) ||
      roles.includes(MemberRoles.Preacher) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Copastor solo se debe tener los roles "discípulo" y "co-pastor"`,
      );
    }

    if (!theirPastor) {
      throw new NotFoundException(
        `Para crear un nuevo copastor coloque un pastor-id existente`,
      );
    }

    //? Validate and assign pastor
    const pastor = await this.pastorRepository.findOne({
      where: { id: theirPastor },
      relations: ['theirChurch', 'copastors'],
    });

    if (!pastor) {
      throw new NotFoundException(`Not found pastor with id ${theirPastor}`);
    }

    if (!pastor.status) {
      throw new BadRequestException(
        `The property status in Pastor must be a "Active"`,
      );
    }

    //* Validate church according pastor
    if (!pastor.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Pastor has a church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: pastor.theirChurch.id },
      relations: ['copastors'],
    });

    if (!church.status) {
      throw new BadRequestException(
        `The property status in Church must be "Active"`,
      );
    }

    // Create new instance
    if (
      roles.includes(MemberRoles.Copastor) &&
      roles.includes(MemberRoles.Disciple)
    ) {
      try {
        const newCopastor = this.copastorRepository.create({
          ...createCopastorDto,
          theirPastor: pastor,
          theirChurch: church,
          createdAt: new Date(),
          createdBy: user,
        });

        return await this.copastorRepository.save(newCopastor);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<Copastor[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.copastorRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirPastor',
        'theirChurch',
        'disciples',
        'preachers',
        'familyHouses',
        'supervisors',
        'zones',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} copastor`;
  }

  //* UPDATE COPASTOR
  async update(
    id: string,
    updateCopastorDto: UpdateCopastorDto,
    user: User,
  ): Promise<Copastor | Pastor> {
    const { roles, status, theirPastor, theirChurch } = updateCopastorDto;

    // Validations
    if (!roles) {
      throw new BadRequestException(
        `Required assign roles to update the copastor`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    // validation copastor
    const copastor = await this.copastorRepository.findOne({
      where: { id: id },
      relations: ['theirPastor', 'theirChurch'],
    });

    if (!copastor) {
      throw new NotFoundException(`Copastor not found with id: ${id}`);
    }

    if (!roles.some((role) => ['disciple', 'copastor'].includes(role))) {
      throw new BadRequestException(
        `The roles should include "disciple" and "copastor"`,
      );
    }

    if (
      copastor.roles.includes(MemberRoles.Copastor) &&
      copastor.roles.includes(MemberRoles.Disciple) &&
      !copastor.roles.includes(MemberRoles.Preacher) &&
      !copastor.roles.includes(MemberRoles.Supervisor) &&
      !copastor.roles.includes(MemberRoles.Pastor) &&
      !copastor.roles.includes(MemberRoles.Treasurer) &&
      (roles.includes(MemberRoles.Supervisor) ||
        roles.includes(MemberRoles.Preacher) ||
        roles.includes(MemberRoles.Treasurer))
    ) {
      throw new BadRequestException(
        `A lower role cannot be assigned without going through the hierarchy: [preacher, supervisor, co-pastor, pastor]`,
      );
    }

    //* Update info about Copastor
    if (
      copastor.roles.includes(MemberRoles.Disciple) &&
      copastor.roles.includes(MemberRoles.Copastor) &&
      !copastor.roles.includes(MemberRoles.Pastor) &&
      !copastor.roles.includes(MemberRoles.Supervisor) &&
      !copastor.roles.includes(MemberRoles.Preacher) &&
      !copastor.roles.includes(MemberRoles.Treasurer) &&
      roles.includes(MemberRoles.Disciple) &&
      roles.includes(MemberRoles.Copastor) &&
      !roles.includes(MemberRoles.Pastor) &&
      !roles.includes(MemberRoles.Supervisor) &&
      !roles.includes(MemberRoles.Preacher) &&
      !roles.includes(MemberRoles.Treasurer)
    ) {
      // Validations
      if (copastor.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `You cannot update it to "inactive", you must delete the record`,
        );
      }

      //? Update if their Pastor is different
      if (copastor.theirPastor?.id !== theirPastor) {
        //* Validate pastor
        if (!theirPastor) {
          throw new NotFoundException(
            `Para actualizar o cambiar de pastor coloque un pastor id existente`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: theirPastor },
          relations: ['theirChurch'],
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
            `Church was not found, verify that Copastor has a church assigned`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newPastor?.theirChurch?.id },
          relations: ['theirMainChurch'],
        });

        if (!newChurch.status) {
          throw new BadRequestException(
            `The property status in Church must be "Active"`,
          );
        }

        //? All members by module
        const allSupervisors = await this.supervisorRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });
        const allZones = await this.zoneRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });
        const allPreachers = await this.preacherRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });
        const allFamilyHouses = await this.familyHouseRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });
        const allDisciples = await this.discipleRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });

        //* Update in all supervisors the new relations of the copastor that is updated.
        const supervisorsByCopastor = allSupervisors.filter(
          (supervisor) => supervisor.theirCopastor?.id === copastor.id,
        );

        const updateSupervisors = supervisorsByCopastor.map(
          async (supervisor) => {
            await this.supervisorRepository.update(supervisor.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
            });
          },
        );

        //* Update in all zones the new relations of the copastor that is updated.
        const zonesByCopastor = allZones.filter(
          (zone) => zone.theirCopastor?.id === copastor.id,
        );

        const updateZones = zonesByCopastor.map(async (zone) => {
          await this.zoneRepository.update(zone.id, {
            theirChurch: newChurch,
            theirPastor: newPastor,
          });
        });

        //* Update in all preachers the new relations of the copastor that is updated.
        const preachersByCopastor = allPreachers.filter(
          (preacher) => preacher.theirCopastor?.id === copastor.id,
        );

        const updatePreachers = preachersByCopastor.map(async (preacher) => {
          await this.preacherRepository.update(preacher.id, {
            theirChurch: newChurch,
            theirPastor: newPastor,
          });
        });

        //* Update in all family houses the new relations of the copastor that is updated.
        const familyHousesByCopastor = allFamilyHouses.filter(
          (familyHouse) => familyHouse.theirCopastor?.id === copastor.id,
        );

        const updateFamilyHouses = familyHousesByCopastor.map(
          async (familyHouse) => {
            await this.familyHouseRepository.update(familyHouse.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
            });
          },
        );

        //* Update in all disciples the new relations of the copastor that is updated.
        const disciplesByCopastor = allDisciples.filter(
          (disciple) => disciple.theirCopastor?.id === copastor.id,
        );

        const updateDisciples = disciplesByCopastor.map(async (disciple) => {
          await this.discipleRepository.update(disciple.id, {
            theirChurch: newChurch,
            theirPastor: newPastor,
          });
        });

        // Update and save
        const updatedCopastor = await this.copastorRepository.preload({
          id: copastor.id,
          ...updateCopastorDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          await Promise.all(updateSupervisors);
          await Promise.all(updateZones);
          await Promise.all(updatePreachers);
          await Promise.all(updateFamilyHouses);
          await Promise.all(updateDisciples);

          return await this.copastorRepository.save(updatedCopastor);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? Update and save if is same Pastor
      const updatedCopastor = await this.copastorRepository.preload({
        id: copastor.id,
        ...updateCopastorDto,
        theirChurch: copastor.theirChurch,
        theirPastor: copastor.theirPastor,
        updatedAt: new Date(),
        updatedBy: user,
        status: status,
      });

      try {
        return await this.copastorRepository.save(updatedCopastor);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Raise Co-pastor level to Pastor
    if (
      copastor.roles.includes(MemberRoles.Disciple) &&
      copastor.roles.includes(MemberRoles.Copastor) &&
      !copastor.roles.includes(MemberRoles.Treasurer) &&
      !copastor.roles.includes(MemberRoles.Supervisor) &&
      !copastor.roles.includes(MemberRoles.Preacher) &&
      !copastor.roles.includes(MemberRoles.Pastor) &&
      roles.includes(MemberRoles.Disciple) &&
      roles.includes(MemberRoles.Pastor) &&
      !roles.includes(MemberRoles.Treasurer) &&
      !roles.includes(MemberRoles.Supervisor) &&
      !roles.includes(MemberRoles.Copastor) &&
      !roles.includes(MemberRoles.Preacher) &&
      status === Status.Active
    ) {
      // Validation new church
      if (!theirChurch) {
        throw new NotFoundException(
          `Para subir de nivel de copastor a pastor coloque un church id existente`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: theirChurch },
        relations: ['theirMainChurch'],
      });

      if (!newChurch) {
        throw new NotFoundException(`Church not found with id: ${id}`);
      }

      if (newChurch.status === Status.Inactive) {
        throw new NotFoundException(
          `The property status in Church must be a "Active"`,
        );
      }
      // TODO : seguir en las entidades menores e ir validando
      // NOTE : Se tiene que mandar todos los campos para crear a un nuevo pastor (front)
      try {
        const newPastor = this.pastorRepository.create({
          ...updateCopastorDto,
          theirChurch: newChurch,
          createdAt: new Date(),
          createdBy: user,
        });

        const savedPastor = this.pastorRepository.save(newPastor);

        await this.copastorRepository.remove(copastor); // onDelete subordinate entities (null)
        return savedPastor;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    } else {
      throw new BadRequestException(
        `You cannot level up, you must have the "Active"`,
      );
    }
  }

  //! DELETE COPASTOR
  async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const copastor = await this.copastorRepository.findOneBy({ id });

    if (!copastor) {
      throw new NotFoundException(`Copastor with id: ${id} not exits`);
    }

    //* Update and set in Inactive on Pastor
    const updatedCopastor = await this.copastorRepository.preload({
      id: copastor.id,
      theirPastor: null,
      theirChurch: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    // Update and set to null relationships in Supervisor (who have same Copastor)
    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirCopastor'],
    });
    const supervisorsByCopastor = allSupervisors.filter(
      (supervisor) => supervisor.theirCopastor?.id === copastor?.id,
    );

    const deleteCopastorInSupervisors = supervisorsByCopastor.map(
      async (supervisor) => {
        await this.supervisorRepository.update(supervisor?.id, {
          theirCopastor: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Zones (who have same Copastor)
    const allZones = await this.zoneRepository.find({
      relations: ['theirCopastor'],
    });
    const zonesByCopastor = allZones.filter(
      (zone) => zone.theirCopastor?.id === copastor?.id,
    );

    const deleteCopastorInZones = zonesByCopastor.map(async (zone) => {
      await this.zoneRepository.update(zone?.id, {
        theirCopastor: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Preacher (who have same Copastor)
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirCopastor'],
    });
    const preachersByCopastor = allPreachers.filter(
      (preacher) => preacher.theirCopastor?.id === copastor?.id,
    );

    const deleteCopastorInPreachers = preachersByCopastor.map(
      async (preacher) => {
        await this.preacherRepository.update(preacher?.id, {
          theirCopastor: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Family House (who have same Copastor)
    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirCopastor'],
    });
    const familyHousesByCopastor = allFamilyHouses.filter(
      (familyHome) => familyHome.theirCopastor?.id === copastor.id,
    );

    const deleteCopastorInFamilyHouses = familyHousesByCopastor.map(
      async (familyHome) => {
        await this.familyHouseRepository.update(familyHome.id, {
          theirCopastor: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Disciple, all those (who have the same Copastor).
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirCopastor'],
    });

    const disciplesByCopastor = allDisciples.filter(
      (disciple) => disciple.theirCopastor?.id === copastor.id,
    );

    const deleteCopastorInDisciples = disciplesByCopastor.map(
      async (disciple) => {
        await this.discipleRepository.update(disciple?.id, {
          theirCopastor: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and save
    try {
      await Promise.all(deleteCopastorInSupervisors);
      await Promise.all(deleteCopastorInZones);
      await Promise.all(deleteCopastorInPreachers);
      await Promise.all(deleteCopastorInFamilyHouses);
      await Promise.all(deleteCopastorInDisciples);
      await this.copastorRepository.save(updatedCopastor);
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
