import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '@/modules/user/entities/';

import { CreateChurchDto, UpdateChurchDto } from '@/modules/church/dto';
import { Church } from '@/modules/church/entities';
import { isUUID } from 'class-validator';
import { Status } from '@/common/enums';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { Zone } from '@/modules/zone/entities';
import { Preacher } from '@/modules/preacher/entities';
import { FamilyHouse } from '@/modules/family-house/entities';
import { Disciple } from '@/modules/disciple/entities';
import { PaginationDto } from '@/common/dtos';

@Injectable()
export class ChurchService {
  private readonly logger = new Logger('ChurchService');

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

  //* CREATE CHURCH
  async create(createChurchDto: CreateChurchDto, user: User): Promise<Church> {
    const { theirMainChurch } = createChurchDto;

    //? Validate and assign main church to anexe church
    if (theirMainChurch) {
      const mainChurch = await this.churchRepository.findOne({
        where: { id: theirMainChurch },
        relations: ['anexes'],
      });

      if (!mainChurch) {
        throw new NotFoundException(
          `Not found church with id ${theirMainChurch}`,
        );
      }

      if (mainChurch.status === Status.Inactive) {
        throw new BadRequestException(
          `The property status in Church must be a "Active"`,
        );
      }

      // Create new instance
      try {
        const newChurch = this.churchRepository.create({
          ...createChurchDto,
          isAnexe: mainChurch ? true : false,
          theirMainChurch: mainChurch,
          createdAt: new Date(),
          createdBy: user,
        });

        return await this.churchRepository.save(newChurch);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    // Create new instance (if their main church not exists)
    try {
      const newChurch = this.churchRepository.create({
        ...createChurchDto,
        isAnexe: false,
        theirMainChurch: null,
        createdAt: new Date(),
        createdBy: user,
      });

      return await this.churchRepository.save(newChurch);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<Church[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.churchRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirMainChurch',
        'disciples',
        'preachers',
        'familyHouses',
        'supervisors',
        'copastors',
        'pastors',
        'anexes',
        'zones',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} anexe`;
  }

  //* UPDATE CHURCH
  async update(
    id: string,
    updateChurchDto: UpdateChurchDto,
    user: User,
  ): Promise<Church> {
    const { status, theirMainChurch } = updateChurchDto;

    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const church = await this.churchRepository.findOne({
      where: { id: id },
      relations: ['theirMainChurch'],
    });

    if (!church) {
      throw new NotFoundException(`Pastor not found with id: ${id}`);
    }

    //* Update info about Church
    // Validations
    if (church.status === Status.Active && status === Status.Inactive) {
      throw new BadRequestException(
        `You cannot update it to "inactive", you must delete the record`,
      );
    }

    //? Update if their main Church is different or update to active
    if (
      church.isAnexe &&
      theirMainChurch &&
      church?.theirMainChurch?.id !== theirMainChurch
    ) {
      //* Validate church
      const newMainChurch = await this.churchRepository.findOne({
        where: { id: theirMainChurch },
        relations: [
          'anexes',
          'pastors',
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyHouses',
          'disciples',
        ],
      });

      if (!newMainChurch) {
        throw new NotFoundException(
          `Church not found with id ${theirMainChurch}`,
        );
      }

      if (!newMainChurch.status) {
        throw new BadRequestException(
          `The property status in copastor must be "Active"`,
        );
      }

      // Update and save
      const updatedChurch = await this.churchRepository.preload({
        id: church.id,
        ...updateChurchDto,
        theirMainChurch: newMainChurch,
        updatedAt: new Date(),
        updatedBy: user,
        status: status,
      });

      try {
        return await this.churchRepository.save(updatedChurch);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is same Church
    const updatedChurch = await this.churchRepository.preload({
      id: church.id,
      ...updateChurchDto,
      theirMainChurch: church.theirMainChurch,
      updatedAt: new Date(),
      updatedBy: user,
      status: status,
    });

    try {
      return await this.churchRepository.save(updatedChurch);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //! DELETE CHURCH
  async remove(id: string, user: User) {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const church = await this.churchRepository.findOne({
      where: { id: id },
      relations: ['theirMainChurch'],
    });

    if (!church) {
      throw new NotFoundException(`Church with id: ${id} not exits`);
    }

    if (!church.isAnexe) {
      throw new NotFoundException(`Church Central no puede ser eliminado`);
    }

    //* Update and set in Inactive on Church (anexe)
    const updatedChurch = await this.churchRepository.preload({
      id: church.id,
      theirMainChurch: null, // no seria necesario borrar los [] porque al borrar las relaciones del their church tmb se elimina de cada uno de los []
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    // Update and set to null relationships in Copastor (who have same Pastor)
    const allPastors = await this.pastorRepository.find({
      relations: ['theirChurch'],
    });
    const pastorsByChurch = allPastors.filter(
      (pastor) => pastor.theirChurch?.id === church?.id,
    );

    const deleteChurchInPastors = pastorsByChurch.map(async (pastor) => {
      await this.pastorRepository.update(pastor?.id, {
        theirChurch: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Copastor (who have same Pastor)
    const allCopastors = await this.copastorRepository.find({
      relations: ['theirChurch'],
    });
    const copastorsByChurch = allCopastors.filter(
      (copastor) => copastor.theirChurch?.id === church?.id,
    );

    const deleteChurchInCopastors = copastorsByChurch.map(async (copastor) => {
      await this.copastorRepository.update(copastor?.id, {
        theirChurch: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Supervisor (who have same Pastor)
    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirChurch'],
    });
    const supervisorsByPastor = allSupervisors.filter(
      (supervisor) => supervisor.theirChurch?.id === church?.id,
    );

    const deleteChurchInSupervisors = supervisorsByPastor.map(
      async (supervisor) => {
        await this.supervisorRepository.update(supervisor?.id, {
          theirChurch: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Zones (who have same Pastor)
    const allZones = await this.zoneRepository.find({
      relations: ['theirChurch'],
    });
    const zonesByPastor = allZones.filter(
      (zone) => zone.theirChurch?.id === church?.id,
    );

    const deleteChurchInZones = zonesByPastor.map(async (zone) => {
      await this.zoneRepository.update(zone?.id, {
        theirChurch: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Preacher (who have same Pastor)
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirChurch'],
    });
    const preachersByPastor = allPreachers.filter(
      (preacher) => preacher.theirChurch?.id === church?.id,
    );

    const deleteChurchInPreachers = preachersByPastor.map(async (preacher) => {
      await this.preacherRepository.update(preacher?.id, {
        theirChurch: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Family House (who have same Pastor)
    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirChurch'],
    });
    const familyHousesByPastor = allFamilyHouses.filter(
      (familyHome) => familyHome.theirChurch?.id === church?.id,
    );

    const deleteChurchInFamilyHouses = familyHousesByPastor.map(
      async (familyHome) => {
        await this.familyHouseRepository.update(familyHome.id, {
          theirChurch: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Disciple, all those (who have the same Pastor).
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirChurch'],
    });

    const disciplesByPastor = allDisciples.filter(
      (disciple) => disciple.theirChurch?.id === church?.id,
    );

    const deleteChurchInDisciples = disciplesByPastor.map(async (disciple) => {
      await this.discipleRepository.update(disciple?.id, {
        theirChurch: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and save
    try {
      await Promise.all(deleteChurchInPastors);
      await Promise.all(deleteChurchInCopastors);
      await Promise.all(deleteChurchInSupervisors);
      await Promise.all(deleteChurchInZones);
      await Promise.all(deleteChurchInPreachers);
      await Promise.all(deleteChurchInFamilyHouses);
      await Promise.all(deleteChurchInDisciples);

      await this.churchRepository.save(updatedChurch);
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
