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

import { MemberRoles, Status } from '@/common/enums';

import { PaginationDto } from '@/common/dtos';
import { CreatePastorDto, UpdatePastorDto } from '@/modules/pastor/dto';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyHouse } from '@/modules/family-house/entities';

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
        `The role "disciple" and "pastor" must be included`,
      );
    }

    if (
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Supervisor) ||
      roles.includes(MemberRoles.Preacher) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `To create a Pastor you only need to have the "disciple" and "pastor" roles.`,
      );
    }

    if (!theirChurch) {
      throw new NotFoundException(
        `To create a pastor you must enter an existing church id.`,
      );
    }

    //? Validate and assign church
    const church = await this.churchRepository.findOne({
      where: { id: theirChurch },
    });

    if (!church) {
      throw new NotFoundException(`Not found church with id ${theirChurch}`);
    }

    if (church.status === Status.Inactive) {
      throw new BadRequestException(
        `The property status in Church must be a "active"`,
      );
    }

    // Create new instance
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

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    const data = await this.pastorRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirChurch',
        'copastors',
        'supervisors',
        'zones',
        'preachers',
        'familyHouses',
        'disciples',
      ],
      relationLoadStrategy: 'query',
      order: { createdAt: 'ASC' },
    });

    const result = data.map((data) => ({
      ...data,
      copastors: data.copastors.map((copastor) => ({
        id: copastor?.id,
        firstName: copastor?.firstName,
        lastName: copastor?.lastName,
      })),
      supervisors: data.supervisors.map((supervisor) => ({
        id: supervisor?.id,
        firstName: supervisor?.firstName,
        lastName: supervisor?.lastName,
      })),
      zones: data.zones.map((zone) => ({
        id: zone?.id,
        zoneName: zone?.zoneName,
        district: zone?.district,
      })),
      preachers: data.preachers.map((preacher) => ({
        id: preacher?.id,
        firstName: preacher?.firstName,
        lastName: preacher?.lastName,
      })),
      familyHouses: data.familyHouses.map((familyHouse) => ({
        id: familyHouse?.id,
        houseName: familyHouse?.houseName,
        zoneName: familyHouse?.zoneName,
        codeHouse: familyHouse?.codeHouse,
        district: familyHouse?.disciples,
        urbanSector: familyHouse?.urbanSector,
      })),
      disciples: data.disciples.map((disciple) => ({
        id: disciple?.id,
        firstName: disciple?.firstName,
        lastName: disciple?.lastName,
      })),
    }));

    return result;
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
        `A lower role cannot be assigned without going through the hierarchy: [disciple, preacher, supervisor, co-pastor, pastor]`,
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
      if (pastor.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `You cannot update it to "inactive", you must delete the record`,
        );
      }

      //? Update if their Church is different
      if (pastor.theirChurch?.id !== theirChurch) {
        //* Validate church
        if (!theirChurch) {
          throw new NotFoundException(`To update, church id is required`);
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: theirChurch },
        });

        if (!newChurch) {
          throw new NotFoundException(
            `Church not found with id ${theirChurch}`,
          );
        }

        if (newChurch.status === Status.Inactive) {
          throw new BadRequestException(
            `The property status in Church must be "active"`,
          );
        }

        // Update and save
        const updatedPastor = await this.pastorRepository.preload({
          id: pastor.id,
          ...updatePastorDto,
          theirChurch: newChurch,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        let savedPastor: Pastor;
        try {
          savedPastor = await this.pastorRepository.save(updatedPastor);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //? Update in subordinate relations
        const allCopastors = await this.copastorRepository.find({
          relations: ['theirPastor'],
        });

        const allSupervisors = await this.supervisorRepository.find({
          relations: ['theirPastor'],
        });

        const allZones = await this.zoneRepository.find({
          relations: ['theirPastor'],
        });

        const allPreachers = await this.preacherRepository.find({
          relations: ['theirPastor'],
        });

        const allFamilyHouses = await this.familyHouseRepository.find({
          relations: ['theirPastor'],
        });

        const allDisciples = await this.discipleRepository.find({
          relations: ['theirPastor'],
        });

        try {
          //* Update and set new relationships in Copastor
          const copastorsByPastor = allCopastors.filter(
            (copastor) => copastor.theirPastor?.id === pastor?.id,
          );

          await Promise.all(
            copastorsByPastor.map(async (copastor) => {
              await this.copastorRepository.update(copastor.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Supervisor
          const supervisorsByPastor = allSupervisors.filter(
            (supervisor) => supervisor.theirPastor?.id === pastor.id,
          );

          await Promise.all(
            supervisorsByPastor.map(async (supervisor) => {
              await this.supervisorRepository.update(supervisor.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Zone
          const zonesByPastor = allZones.filter(
            (zone) => zone.theirPastor?.id === pastor.id,
          );

          await Promise.all(
            zonesByPastor.map(async (zone) => {
              await this.zoneRepository.update(zone.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Preacher
          const preachersByPastor = allPreachers.filter(
            (preacher) => preacher.theirPastor?.id === pastor.id,
          );

          await Promise.all(
            preachersByPastor.map(async (preacher) => {
              await this.preacherRepository.update(preacher.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Family House
          const familyHousesByPastor = allFamilyHouses.filter(
            (familyHouse) => familyHouse.theirPastor?.id === pastor.id,
          );

          await Promise.all(
            familyHousesByPastor.map(async (familyHouse) => {
              await this.familyHouseRepository.update(familyHouse.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Disciple
          const disciplesByPastor = allDisciples.filter(
            (disciple) => disciple.theirPastor?.id === pastor.id,
          );

          await Promise.all(
            disciplesByPastor.map(async (disciple) => {
              await this.discipleRepository.update(disciple.id, {
                theirChurch: newChurch,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }

        return savedPastor;
      }

      //? Update and save if is same Church
      if (pastor.theirChurch?.id !== theirChurch) {
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

    try {
      await this.pastorRepository.save(updatedPastor);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allCopastores = await this.copastorRepository.find({
      relations: ['theirPastor'],
    });

    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirPastor'],
    });

    const allZones = await this.zoneRepository.find({
      relations: ['theirPastor'],
    });

    const allPreachers = await this.preacherRepository.find({
      relations: ['theirPastor'],
    });

    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirPastor'],
    });

    const allDisciples = await this.discipleRepository.find({
      relations: ['theirPastor'],
    });

    try {
      //* Update and set to null relationships in Copastor
      const copastorsByPastor = allCopastores.filter(
        (copastor) => copastor.theirPastor?.id === pastor?.id,
      );

      await Promise.all(
        copastorsByPastor.map(async (copastor) => {
          await this.copastorRepository.update(copastor?.id, {
            theirPastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Supervisor
      const supervisorsByPastor = allSupervisors.filter(
        (supervisor) => supervisor.theirPastor?.id === pastor?.id,
      );

      await Promise.all(
        supervisorsByPastor.map(async (supervisor) => {
          await this.supervisorRepository.update(supervisor?.id, {
            theirPastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Zone
      const zonesByPastor = allZones.filter(
        (zone) => zone.theirPastor?.id === pastor?.id,
      );

      await Promise.all(
        zonesByPastor.map(async (zone) => {
          await this.zoneRepository.update(zone?.id, {
            theirPastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Preacher
      const preachersByPastor = allPreachers.filter(
        (preacher) => preacher.theirPastor?.id === pastor?.id,
      );

      await Promise.all(
        preachersByPastor.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirPastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Family House
      const familyHousesByPastor = allFamilyHouses.filter(
        (familyHome) => familyHome.theirPastor?.id === pastor.id,
      );

      await Promise.all(
        familyHousesByPastor.map(async (familyHome) => {
          await this.familyHouseRepository.update(familyHome.id, {
            theirPastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciple
      const disciplesByPastor = allDisciples.filter(
        (disciple) => disciple.theirPastor?.id === pastor.id,
      );

      await Promise.all(
        disciplesByPastor.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirPastor: null,
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
