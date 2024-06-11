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

import { Church } from '@/modules/church/entities';
import { CreateChurchDto, UpdateChurchDto } from '@/modules/church/dto';

import { Status } from '@/common/enums';
import { PaginationDto } from '@/common/dtos';

import { User } from '@/modules/user/entities';
import { Zone } from '@/modules/zone/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyHouse } from '@/modules/family-house/entities';

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

    const mainChurch = await this.churchRepository.findOne({
      where: { isAnexe: false },
    });

    if (mainChurch && !theirMainChurch) {
      throw new BadRequestException(
        `A main church already exists, you can only create annex churches, assign a main church to the annex`,
      );
    }

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

      if (mainChurch.isAnexe) {
        throw new NotFoundException(
          `You cannot assign an annex church as the main church of another annex`,
        );
      }

      if (mainChurch.status === Status.Inactive) {
        throw new BadRequestException(
          `The property status in Church must be a "active"`,
        );
      }

      // Create new instance
      try {
        const newChurch = this.churchRepository.create({
          ...createChurchDto,
          isAnexe: true,
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
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    const data = await this.churchRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
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
      relationLoadStrategy: 'query',
      order: { createdAt: 'ASC' },
    });

    const theirMainChurch = await this.churchRepository.findOne({
      where: { status: Status.Active, isAnexe: false },
    });

    const result = data.map((data) => ({
      ...data,
      theirMainChurch: data.isAnexe ? theirMainChurch : null,
      anexes: data.anexes.map((anexe) => ({
        id: anexe?.id,
        churchName: anexe?.churchName,
        district: anexe?.district,
        urbanSector: anexe?.urbanSector,
      })),
      pastors: data?.pastors.map((pastor) => ({
        id: pastor?.id,
        firstName: pastor?.firstName,
        lastName: pastor?.lastName,
      })),
      copastors: data?.copastors.map((copastor) => ({
        id: copastor?.id,
        firstName: copastor?.firstName,
        lastName: copastor?.lastName,
      })),
      supervisors: data?.supervisors.map((supervisor) => ({
        id: supervisor?.id,
        firstName: supervisor?.firstName,
        lastName: supervisor?.lastName,
      })),
      zones: data?.zones.map((zone) => ({
        id: zone?.id,
        zoneName: zone?.zoneName,
        district: zone?.district,
      })),
      preachers: data?.preachers.map((preacher) => ({
        id: preacher?.id,
        firstName: preacher?.firstName,
        lastName: preacher?.lastName,
      })),
      familyHouses: data?.familyHouses.map((familyHouse) => ({
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
      throw new NotFoundException(`Church not found with id: ${id}`);
    }

    if (!church.isAnexe && theirMainChurch) {
      throw new BadRequestException(
        `Cannot assign a home church to the home church`,
      );
    }

    if (!church.isAnexe && church.isAnexe) {
      throw new BadRequestException(
        `You cannot change the main church to an annex`,
      );
    }

    if (church.status === Status.Active && status === Status.Inactive) {
      throw new BadRequestException(
        `You cannot update it to "inactive", you must delete the record`,
      );
    }

    //? Update if their main Church is different
    if (
      church.isAnexe &&
      theirMainChurch &&
      church?.theirMainChurch?.id !== theirMainChurch
    ) {
      // Validate new main church
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
          `Main church not found with id ${theirMainChurch}`,
        );
      }

      if (newMainChurch.isAnexe) {
        throw new NotFoundException(
          `You cannot assign an annex church as the main church`,
        );
      }

      if (newMainChurch.status === Status.Inactive) {
        throw new BadRequestException(
          `The property status in main church must be "active"`,
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
      throw new NotFoundException(`Main Church cannot be removed`);
    }

    //* Update and set in Inactive on Church (anexe)
    const updatedChurch = await this.churchRepository.preload({
      id: church.id,
      theirMainChurch: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    try {
      await this.churchRepository.save(updatedChurch);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allPastors = await this.pastorRepository.find({
      relations: ['theirChurch'],
    });

    const allCopastors = await this.copastorRepository.find({
      relations: ['theirChurch'],
    });

    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirChurch'],
    });

    const allZones = await this.zoneRepository.find({
      relations: ['theirChurch'],
    });

    const allPreachers = await this.preacherRepository.find({
      relations: ['theirChurch'],
    });

    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirChurch'],
    });

    const allDisciples = await this.discipleRepository.find({
      relations: ['theirChurch'],
    });

    try {
      //* Update and set to null relationships in Pastor
      const pastorsByChurch = allPastors.filter(
        (pastor) => pastor.theirChurch?.id === church?.id,
      );

      await Promise.all(
        pastorsByChurch.map(async (pastor) => {
          await this.pastorRepository.update(pastor?.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Copastor
      const copastorsByChurch = allCopastors.filter(
        (copastor) => copastor.theirChurch?.id === church?.id,
      );

      await Promise.all(
        copastorsByChurch.map(async (copastor) => {
          await this.copastorRepository.update(copastor?.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Supervisor
      const supervisorsByPastor = allSupervisors.filter(
        (supervisor) => supervisor.theirChurch?.id === church?.id,
      );

      await Promise.all(
        supervisorsByPastor.map(async (supervisor) => {
          await this.supervisorRepository.update(supervisor?.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Zone
      const zonesByPastor = allZones.filter(
        (zone) => zone.theirChurch?.id === church?.id,
      );

      await Promise.all(
        zonesByPastor.map(async (zone) => {
          await this.zoneRepository.update(zone?.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Preacher
      const preachersByPastor = allPreachers.filter(
        (preacher) => preacher.theirChurch?.id === church?.id,
      );

      await Promise.all(
        preachersByPastor.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Family house
      const familyHousesByPastor = allFamilyHouses.filter(
        (familyHome) => familyHome.theirChurch?.id === church?.id,
      );

      await Promise.all(
        familyHousesByPastor.map(async (familyHome) => {
          await this.familyHouseRepository.update(familyHome.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciple
      const disciplesByPastor = allDisciples.filter(
        (disciple) => disciple.theirChurch?.id === church?.id,
      );

      await Promise.all(
        disciplesByPastor.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirChurch: null,
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
