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

import { RecordStatus } from '@/common/enums';
import { PaginationDto } from '@/common/dtos';

import { CreateZoneDto, UpdateZoneDto } from '@/modules/zone/dto';

import { User } from '@/modules/user/entities';
import { Zone } from '@/modules/zone/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';

@Injectable()
export class ZoneService {
  private readonly logger = new Logger('ZoneService');

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

    @InjectRepository(FamilyGroup)
    private readonly familyGroupRepository: Repository<FamilyGroup>,

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,
  ) {}

  //* CREATE ZONE
  async create(createZoneDto: CreateZoneDto, user: User): Promise<Zone> {
    const { theirSupervisor } = createZoneDto;

    //? Validate and assign supervisor
    if (!theirSupervisor) {
      throw new NotFoundException(
        `To create a new zone enter an existing supervisor id`,
      );
    }
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: theirSupervisor },
      relations: ['theirChurch', 'theirCopastor', 'theirPastor', 'theirZone'],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Not found Supervisor with id ${theirSupervisor}`,
      );
    }

    if (supervisor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `The property status in Supervisor must be a "active"`,
      );
    }

    //* Validate and assign copastor according supervisor
    if (!supervisor?.theirCopastor) {
      throw new NotFoundException(
        `Copastor was not found, verify that Supervisor has a co-pastor assigned`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: supervisor?.theirCopastor?.id },
    });

    if (copastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `The property status in Copastor must be a "active"`,
      );
    }

    //* Validate and assign pastor according supervisor
    if (!supervisor?.theirPastor) {
      throw new NotFoundException(
        `Pastor was not found, verify that Supervisor has a pastor assigned`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: supervisor?.theirPastor?.id },
    });

    if (pastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `The property status in Pastor must be a "active"`,
      );
    }

    //* Validate and assign church according supervisor
    if (!supervisor?.theirChurch) {
      throw new NotFoundException(
        `Church was not found, verify that Supervisor has a church assigned`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: supervisor?.theirChurch?.id },
    });

    if (church.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `The property status in Church must be a "active"`,
      );
    }

    // Create new instance
    try {
      const newZone = this.zoneRepository.create({
        ...createZoneDto,
        theirChurch: church,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirSupervisor: supervisor,
        createdAt: new Date(),
        createdBy: user,
      });

      const savedZone = await this.zoneRepository.save(newZone);

      supervisor.theirZone = savedZone;

      await this.supervisorRepository.save(supervisor);
      return savedZone;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit = 10, offset = 0 } = paginationDto;

    const data = await this.zoneRepository.find({
      where: { recordStatus: RecordStatus.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'familyGroups',
        'preachers',
        'disciples',
      ],
      relationLoadStrategy: 'query',
      order: { createdAt: 'ASC' },
    });

    const result = data.map((data) => ({
      ...data,
      theirChurch: {
        id: data.theirChurch.id,
        churchName: data.theirChurch.churchName,
      },
      theirPastor: {
        id: data.theirPastor.id,
        firstName: data.theirPastor.firstName,
        lastName: data.theirPastor.lastName,
        roles: data.theirPastor.roles,
      },
      theirCopastor: {
        id: data.theirCopastor.id,
        firstName: data.theirCopastor.firstName,
        lastName: data.theirCopastor.lastName,
        roles: data.theirCopastor.roles,
      },
      theirSupervisor: {
        id: data.theirSupervisor.id,
        firstName: data.theirSupervisor.firstName,
        lastName: data.theirSupervisor.lastName,
        roles: data.theirSupervisor.roles,
      },
      preachers: data.preachers.map((preacher) => ({
        id: preacher.id,
        firstName: preacher.firstName,
        lastName: preacher.lastName,
      })),
      familyGroups: data.familyGroups.map((familyGroup) => ({
        id: familyGroup.id,
        familyGroupName: familyGroup.familyGroupName,
        familyGroupCode: familyGroup.familyGroupCode,
        district: familyGroup.district,
        urbanSector: familyGroup.urbanSector,
        theirZone: familyGroup.theirZone,
      })),
      disciples: data.disciples.map((disciple) => ({
        id: disciple.id,
        firstName: disciple.firstName,
        lastName: disciple.lastName,
      })),
    }));

    return result;
  }

  findOne(id: number) {
    return `This action returns a #${id} zone`;
  }

  //* UPDATE ZONE
  async update(
    id: string,
    updateZoneDto: UpdateZoneDto,
    user: User,
  ): Promise<Zone> {
    const { recordStatus, theirSupervisor } = updateZoneDto;

    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    // validation zone
    const zone = await this.zoneRepository.findOne({
      where: { id: id },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
      ],
    });

    if (!zone) {
      throw new NotFoundException(`Zone not found with id: ${id}`);
    }

    if (
      zone.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `You cannot update it to "inactive", you must delete the record`,
      );
    }

    if (!theirSupervisor) {
      throw new NotFoundException(`To update, supervisor id is required`);
    }

    //? Update if their Supervisor is different
    if (zone.theirSupervisor?.id !== theirSupervisor) {
      //* Validate supervisor
      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: theirSupervisor },
        relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
      });

      if (!newSupervisor) {
        throw new NotFoundException(
          `Supervisor not found with id ${theirSupervisor}`,
        );
      }

      if (newSupervisor.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `The property status in Supervisor must be "active"`,
        );
      }

      //* Validate Copastor according supervisor
      if (!newSupervisor?.theirCopastor) {
        throw new BadRequestException(
          `Copastor was not found, verify that Supervisor has a co-pastor assigned`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newSupervisor?.theirCopastor?.id },
      });

      if (newCopastor.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `The property status in Copastor must be "active"`,
        );
      }

      //* Validate Pastor according supervisor
      if (!newSupervisor?.theirPastor) {
        throw new BadRequestException(
          `Pastor was not found, verify that Supervisor has a pastor assigned`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newSupervisor?.theirPastor?.id },
      });

      if (newPastor.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `The property status in Pastor must be "active"`,
        );
      }

      //* Validate Church according supervisor
      if (!newSupervisor?.theirChurch) {
        throw new BadRequestException(
          `Church was not found, verify that Supervisor has a church assigned`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newSupervisor?.theirChurch?.id },
      });

      if (newChurch.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `The property status in Church must be "active"`,
        );
      }

      //? All subordinate entities
      const allPreachers = await this.preacherRepository.find({
        relations: ['theirZone'],
      });

      const allFamilyGroups = await this.familyGroupRepository.find({
        relations: ['theirZone'],
      });

      const allDisciples = await this.discipleRepository.find({
        relations: ['theirZone'],
      });

      //! Eliminar relaciones de zone y supervisor (independiente)
      //* Setear a null la zona del antiguo supervisor
      if (zone?.theirSupervisor?.id) {
        const updateOldSupervisor = await this.supervisorRepository.preload({
          id: zone?.theirSupervisor?.id,
          theirZone: null,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        await this.supervisorRepository.save(updateOldSupervisor);
      }

      //* Setear a null el supervisor de la nueva zona
      if (newSupervisor?.theirZone?.id) {
        const updatedNewZone = await this.zoneRepository.preload({
          id: newSupervisor?.theirZone?.id,
          theirSupervisor: null,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        await this.zoneRepository.save(updatedNewZone);
      }

      //! Quitamos del nuevo supervisor todas sus relaciones subordinadas porque pertenecerá a otra zona
      try {
        //* Update and set to null relationships in Preacher
        const preachersByNewZone = allPreachers.filter(
          (preacher) => preacher.theirZone?.id === newSupervisor?.theirZone?.id,
        );

        await Promise.all(
          preachersByNewZone.map(async (preacher) => {
            await this.preacherRepository.update(preacher.id, {
              theirSupervisor: null,
            });
          }),
        );

        //* Update and set to null relationships in Family House
        const familyGroupsByNewZone = allFamilyGroups.filter(
          (familyGroup) =>
            familyGroup.theirZone?.id === newSupervisor?.theirZone?.id,
        );

        await Promise.all(
          familyGroupsByNewZone.map(async (familyGroup) => {
            await this.familyGroupRepository.update(familyGroup.id, {
              theirSupervisor: null,
            });
          }),
        );

        //* Update and set to null relationships in Disciple
        const disciplesByNewZone = allDisciples.filter(
          (disciple) => disciple.theirZone?.id === newSupervisor?.theirZone?.id,
        );

        await Promise.all(
          disciplesByNewZone.map(async (disciple) => {
            await this.discipleRepository.update(disciple.id, {
              theirSupervisor: null,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }

      // Update zone
      const updatedZone = await this.zoneRepository.preload({
        id: zone.id,
        ...updateZoneDto,
        theirChurch: newChurch,
        theirPastor: newPastor,
        theirCopastor: newCopastor,
        theirSupervisor: newSupervisor,
        updatedAt: new Date(),
        updatedBy: user,
        recordStatus: recordStatus,
      });

      let savedZone: Zone;
      try {
        newSupervisor.theirZone = null;
        await this.supervisorRepository.save(newSupervisor);

        savedZone = await this.zoneRepository.save(updatedZone);

        newSupervisor.theirZone = savedZone;
        newSupervisor.updatedAt = new Date();
        newSupervisor.updatedBy = user;

        await this.supervisorRepository.save(newSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Set new relationships in subordinate entities
      try {
        //* Update and set new relationships in Preacher
        const preachersByZone = allPreachers.filter(
          (preacher) => preacher.theirZone?.id === zone?.id,
        );

        await Promise.all(
          preachersByZone.map(async (preacher) => {
            await this.preacherRepository.update(preacher.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              theirSupervisor: newSupervisor,
            });
          }),
        );

        //* Update and set new relationships in Family House
        const familyGroupsByZone = allFamilyGroups.filter(
          (familyGroup) => familyGroup.theirZone?.id === zone?.id,
        );

        await Promise.all(
          familyGroupsByZone.map(async (familyGroup, index) => {
            await this.familyGroupRepository.update(familyGroup.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              theirSupervisor: newSupervisor,
              // zoneName: savedZone.zoneName,
              familyGroupCode: `${savedZone.zoneName}-${index + 1}`,
            });
          }),
        );

        //* Update and set new relationships in Disciple
        const disciplesByZone = allDisciples.filter(
          (disciple) => disciple.theirZone?.id === zone?.id,
        );

        await Promise.all(
          disciplesByZone.map(async (disciple) => {
            await this.discipleRepository.update(disciple.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              theirSupervisor: newSupervisor,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }
      return savedZone;
    }

    //? Update and save if is same supervisor
    if (zone.theirSupervisor?.id === theirSupervisor) {
      const updatedZone = await this.zoneRepository.preload({
        id: zone.id,
        ...updateZoneDto,
        theirChurch: zone.theirChurch,
        theirPastor: zone.theirPastor,
        theirCopastor: zone.theirCopastor,
        theirSupervisor: zone.theirSupervisor,
        updatedAt: new Date(),
        updatedBy: user,
        recordStatus: recordStatus,
      });

      const allFamilyGroups = await this.familyGroupRepository.find({
        relations: ['theirZone'],
      });

      //* Update and set new zone name and code in Family House
      const familyGroupsByZone = allFamilyGroups.filter(
        (familyGroup) => familyGroup.theirZone?.id === zone?.id,
      );

      await Promise.all(
        familyGroupsByZone.map(async (familyGroup, index) => {
          await this.familyGroupRepository.update(familyGroup.id, {
            theirChurch: zone.theirChurch,
            theirPastor: zone.theirPastor,
            theirCopastor: zone.theirCopastor,
            theirSupervisor: zone.theirSupervisor,
            // zoneName: updateZoneDto.zoneName,
            familyGroupCode: `${updateZoneDto.zoneName}-${index + 1}`,
          });
        }),
      );

      try {
        return await this.zoneRepository.save(updatedZone);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  // NOTE : Seguir aquí no usar el delete
  // NOTE : la zona no debería eliminarse  ni desactivarse, solo actualizarse, porque afectaría a sus relaciones con ofrenda
  // NOTE : si la zona se actualiza de super es indiferente porque la relacione s solo con zona.
  // NOTE : no debería eliminarse

  //! DELETE ZONE
  /*async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const zone = await this.zoneRepository.findOneBy({ id });

    if (!zone) {
      throw new NotFoundException(`Supervisor with id: ${id} not exits`);
    }

    //* Update and set in Inactive on Zone
    const updatedZone = await this.zoneRepository.preload({
      id: zone.id,
      theirChurch: null,
      theirPastor: null,
      theirCopastor: null,
      theirSupervisor: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    // Update and set to null relationships in Preacher (who have same Zone)
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirZone'],
    });
    const preachersByZone = allPreachers.filter(
      (preacher) => preacher.theirZone?.id === zone?.id,
    );

    const deleteZoneInPreachers = preachersByZone.map(async (preacher) => {
      await this.preacherRepository.update(preacher?.id, {
        theirZone: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and set to null relationships in Family House (who have same Zone)
    const allFamilyHouses = await this.familyHouseRepository.find({
      relations: ['theirZone'],
    });
    const familyHousesByZone = allFamilyHouses.filter(
      (familyHome) => familyHome.theirZone?.id === zone?.id,
    );

    const deleteZoneInFamilyHouses = familyHousesByZone.map(
      async (familyHome) => {
        await this.familyHouseRepository.update(familyHome.id, {
          theirZone: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
      },
    );

    // Update and set to null relationships in Disciple, all those (who have the same Zone).
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirZone'],
    });

    const disciplesByZone = allDisciples.filter(
      (disciple) => disciple.theirZone?.id === zone.id,
    );

    const deleteZoneInDisciple = disciplesByZone.map(async (disciple) => {
      await this.discipleRepository.update(disciple?.id, {
        theirZone: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    });

    // Update and save
    try {
      await Promise.all(deleteZoneInPreachers);
      await Promise.all(deleteZoneInFamilyHouses);
      await Promise.all(deleteZoneInDisciple);

      await this.zoneRepository.save(updatedZone);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }*/

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
