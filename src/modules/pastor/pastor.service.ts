import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { MemberRoles, Status } from '@/common/enums';

import { Pastor } from '@/modules/pastor/entities';
import { CreatePastorDto, UpdatePastorDto } from '@/modules/pastor/dto';

import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { isUUID } from 'class-validator';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { Zone } from '@/modules/zone/entities';
import { Preacher } from '@/modules/preacher/entities';
import { FamilyHouse } from '@/modules/family-house/entities';
import { Disciple } from '@/modules/disciple/entities/';
import { PaginationDto } from '@/common/dtos';

@Injectable()
export class PastorService {
  private readonly logger = new Logger('PastorService');

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

  //* CREATE PASTOR
  async create(createPastorDto: CreatePastorDto, user: User): Promise<Pastor> {
    const { roles, theirChurch } = createPastorDto;

    // Validations
    if (
      !roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Pastor)
    ) {
      throw new BadRequestException(
        `El rol "disciple" y "pastor" debe ser incluido`,
      );
    }

    if (
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Supervisor) ||
      roles.includes(MemberRoles.Preacher) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Pastor solo se debe tener los roles "discípulo" y "pastor"`,
      );
    }

    if (!theirChurch) {
      throw new NotFoundException(
        `Para crear un nuevo pastor coloque un church-id existente`,
      );
    }

    //? Validate and assign church
    const church = await this.churchRepository.findOne({
      where: { id: theirChurch },
      relations: ['pastors'],
    });

    if (!church) {
      throw new NotFoundException(`Not found pastor with id ${theirChurch}`);
    }

    if (!church.status) {
      throw new BadRequestException(
        `The property status in Church must be a "Active"`,
      );
    }

    // Create new instance
    if (
      roles.includes(MemberRoles.Pastor) &&
      roles.includes(MemberRoles.Disciple)
    ) {
      try {
        const newPastor = this.pastorRepository.create({
          ...createPastorDto,
          theirChurch: church,
          createdAt: new Date(),
          createdBy: user,
        });

        return await this.pastorRepository.save(newPastor);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<Pastor[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.pastorRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirChurch',
        'disciples',
        'preachers',
        'familyHouses',
        'supervisors',
        'copastors',
        'zones',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} pastor`;
  }

  //* UPDATE PASTOR
  async update(
    id: string,
    updatePastorDto: UpdatePastorDto,
    user: User,
  ): Promise<Pastor> {
    const { roles, status, theirChurch } = updatePastorDto;

    // Validations
    if (!roles) {
      throw new BadRequestException(
        `Required assign roles to update the pastor`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: id },
      relations: ['theirChurch'],
    });

    if (!pastor) {
      throw new NotFoundException(`Pastor not found with id: ${id}`);
    }

    if (!roles.includes(MemberRoles.Disciple)) {
      throw new BadRequestException(
        `The "disciple" role should always be included in the roles`,
      );
    }

    if (!roles.some((role) => ['disciple', 'pastor'].includes(role))) {
      throw new BadRequestException(
        `The roles should include "disciple" and "pastor"`,
      );
    }

    if (
      pastor.roles.includes(MemberRoles.Pastor) &&
      pastor.roles.includes(MemberRoles.Disciple) &&
      !pastor.roles.includes(MemberRoles.Preacher) &&
      !pastor.roles.includes(MemberRoles.Supervisor) &&
      !pastor.roles.includes(MemberRoles.Copastor) &&
      !pastor.roles.includes(MemberRoles.Treasurer) &&
      (roles.includes(MemberRoles.Supervisor) ||
        roles.includes(MemberRoles.Copastor) ||
        roles.includes(MemberRoles.Preacher) ||
        roles.includes(MemberRoles.Treasurer))
    ) {
      throw new BadRequestException(
        `A lower role cannot be assigned without going through the hierarchy: [preacher, supervisor, co-pastor, pastor]`,
      );
    }

    //* Update info about Pastor
    if (
      pastor.roles.includes(MemberRoles.Disciple) &&
      pastor.roles.includes(MemberRoles.Pastor) &&
      !pastor.roles.includes(MemberRoles.Copastor) &&
      !pastor.roles.includes(MemberRoles.Supervisor) &&
      !pastor.roles.includes(MemberRoles.Preacher) &&
      !pastor.roles.includes(MemberRoles.Treasurer) &&
      roles.includes(MemberRoles.Disciple) &&
      roles.includes(MemberRoles.Pastor) &&
      !roles.includes(MemberRoles.Copastor) &&
      !roles.includes(MemberRoles.Supervisor) &&
      !roles.includes(MemberRoles.Preacher) &&
      !roles.includes(MemberRoles.Treasurer)
    ) {
      // Validations
      if (pastor.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `You cannot update it to "inactive", you must delete the record`,
        );
      }

      //? Update if their Church is different
      if (pastor.theirChurch?.id !== theirChurch) {
        //* Validate church
        if (!theirChurch) {
          throw new NotFoundException(
            `Para actualizar o cambiar de church coloque un church id existente`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: theirChurch },
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

        if (!newChurch) {
          throw new NotFoundException(
            `Church not found with id ${theirChurch}`,
          );
        }

        if (!newChurch.status) {
          throw new BadRequestException(
            `The property status in Church must be "Active"`,
          );
        }

        //? All members by module
        const allCopastors = await this.copastorRepository.find({
          relations: ['theirPastor', 'theirChurch'],
        });

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

        //* Update in all co-pastors the new church of the pastor that is updated.
        const copastorsByPastor = allCopastors.filter(
          (copastor) => copastor.theirPastor?.id === pastor?.id,
        );

        const updateCopastorsChurch = copastorsByPastor.map(
          async (copastor) => {
            await this.copastorRepository.update(copastor.id, {
              theirChurch: newChurch,
            });
          },
        );

        //* Update in all supervisors the new church of the pastor that is updated.
        const supervisorsByPastor = allSupervisors.filter(
          (supervisor) => supervisor.theirPastor?.id === pastor.id,
        );

        const updateSupervisorsChurch = supervisorsByPastor.map(
          async (supervisor) => {
            await this.supervisorRepository.update(supervisor.id, {
              theirChurch: newChurch,
            });
          },
        );

        //* Update in all zones the new church of the pastor that is updated.
        const zonesByPastor = allZones.filter(
          (zone) => zone.theirPastor?.id === pastor.id,
        );

        const updateZonesChurch = zonesByPastor.map(async (zone) => {
          await this.zoneRepository.update(zone.id, {
            theirChurch: newChurch,
          });
        });

        //* Update in all preachers the new church of the pastor that is updated.
        const preachersByPastor = allPreachers.filter(
          (preacher) => preacher.theirPastor?.id === pastor.id,
        );

        const updatePreachersChurch = preachersByPastor.map(
          async (preacher) => {
            await this.preacherRepository.update(preacher.id, {
              theirChurch: newChurch,
            });
          },
        );

        //* Update in all family houses the new church of the pastor that is updated.
        const familyHousesByPastor = allFamilyHouses.filter(
          (familyHouse) => familyHouse.theirPastor?.id === pastor.id,
        );

        const updateFamilyHousesChurch = familyHousesByPastor.map(
          async (familyHouse) => {
            await this.familyHouseRepository.update(familyHouse.id, {
              theirChurch: newChurch,
            });
          },
        );

        //* Update on all disciples the new church of the pastor that is updated.
        const disciplesByPastor = allDisciples.filter(
          (disciple) => disciple.theirPastor?.id === pastor.id,
        );

        const updateDisciplesChurch = disciplesByPastor.map(
          async (disciple) => {
            await this.discipleRepository.update(disciple.id, {
              theirChurch: newChurch,
            });
          },
        );

        // Update and save
        const updatedPastor = await this.pastorRepository.preload({
          id: pastor.id,
          ...updatePastorDto,
          theirChurch: newChurch,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          await Promise.all(updateCopastorsChurch);
          await Promise.all(updateSupervisorsChurch);
          await Promise.all(updateZonesChurch);
          await Promise.all(updatePreachersChurch);
          await Promise.all(updateFamilyHousesChurch);
          await Promise.all(updateDisciplesChurch);
          return await this.pastorRepository.save(updatedPastor);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? Update and save if is same Church
      const updatedPastor = await this.pastorRepository.preload({
        id: pastor.id,
        ...updatePastorDto,
        theirChurch: pastor.theirChurch,
        updatedAt: new Date(),
        updatedBy: user,
        status: status,
      });

      try {
        return await this.pastorRepository.save(updatedPastor);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //! DELETE PASTOR
  async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const pastor = await this.pastorRepository.findOneBy({ id });

    if (!pastor) {
      throw new NotFoundException(`Pastor with id: ${id} not exits`);
    }

    //* Update and set in Inactive on Pastor
    const updatedPastor = await this.pastorRepository.preload({
      id: pastor.id,
      theirChurch: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    // Update and set to null relationships in Copastor (who have same Pastor)
    const allCopastores = await this.copastorRepository.find({
      relations: ['theirPastor'],
    });
    const copastorsByPastor = allCopastores.filter(
      (copastor) => copastor.theirPastor?.id === pastor?.id,
    );

    const deletePastorInCopastors = copastorsByPastor.map(async (copastor) => {
      await this.copastorRepository.update(copastor?.id, {
        theirPastor: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Supervisor (who have same Pastor)
    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirPastor'],
    });
    const supervisorsByPastor = allSupervisors.filter(
      (supervisor) => supervisor.theirPastor?.id === pastor?.id,
    );

    const deletePastorInSupervisors = supervisorsByPastor.map(
      async (supervisor) => {
        await this.supervisorRepository.update(supervisor?.id, {
          theirPastor: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Zones (who have same Pastor)
    const allZones = await this.zoneRepository.find({
      relations: ['theirPastor'],
    });
    const zonesByPastor = allZones.filter(
      (zone) => zone.theirPastor?.id === pastor?.id,
    );

    const deletePastorInZones = zonesByPastor.map(async (zone) => {
      await this.zoneRepository.update(zone?.id, {
        theirPastor: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Preacher (who have same Pastor)
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirPastor'],
    });
    const preachersByPastor = allPreachers.filter(
      (preacher) => preacher.theirPastor?.id === pastor?.id,
    );

    const deletePastorInPreachers = preachersByPastor.map(async (preacher) => {
      await this.preacherRepository.update(preacher?.id, {
        theirPastor: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Family House (who have same Pastor)
    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirPastor'],
    });
    const familyHousesByPastor = allFamilyHouses.filter(
      (familyHome) => familyHome.theirPastor?.id === pastor.id,
    );

    const deletePastorInFamilyHouses = familyHousesByPastor.map(
      async (familyHome) => {
        await this.familyHouseRepository.update(familyHome.id, {
          theirPastor: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Disciple, all those (who have the same Pastor).
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirPastor'],
    });

    const disciplesByPastor = allDisciples.filter(
      (disciple) => disciple.theirPastor?.id === pastor.id,
    );

    const deletePastorInDisciples = disciplesByPastor.map(async (disciple) => {
      await this.discipleRepository.update(disciple?.id, {
        theirPastor: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and save
    try {
      await Promise.all(deletePastorInCopastors);
      await Promise.all(deletePastorInSupervisors);
      await Promise.all(deletePastorInZones);
      await Promise.all(deletePastorInPreachers);
      await Promise.all(deletePastorInFamilyHouses);
      await Promise.all(deletePastorInDisciples);
      await this.pastorRepository.save(updatedPastor);
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
