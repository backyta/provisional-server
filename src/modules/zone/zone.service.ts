import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';

import { Status } from '@/common/enums';
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
import { FamilyHouse } from '@/modules/family-house/entities';

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

    @InjectRepository(FamilyHouse)
    private readonly familyHouseRepository: Repository<FamilyHouse>,

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,
  ) {}

  //* CREATE ZONE
  async create(createZoneDto: CreateZoneDto, user: User): Promise<Zone> {
    const { theirSupervisor } = createZoneDto;

    //? Validate and assign supervisor
    if (!theirSupervisor) {
      throw new NotFoundException(
        `Para crear una nueva zona coloque un supervisor id existente`,
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

    if (supervisor.status === Status.Inactive) {
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

    if (copastor?.status === Status.Inactive) {
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

    if (pastor?.status === Status.Inactive) {
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

    if (church.status === Status.Inactive) {
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
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'theirChurch',
        'theirCopastor',
        'theirPastor',
        'theirSupervisor',
        'preachers',
        'familyHouses',
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
      familyHouses: data.familyHouses.map((familyHouse) => ({
        id: familyHouse.id,
        houseName: familyHouse.houseName,
        zoneName: familyHouse.zoneName,
        codeHouse: familyHouse.codeHouse,
        district: familyHouse.district,
        urbanSector: familyHouse.urbanSector,
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
    const { status, theirSupervisor } = updateZoneDto;

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

    if (zone.status === Status.Active && status === Status.Inactive) {
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

      if (newSupervisor.status === Status.Inactive) {
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

      if (newCopastor.status === Status.Inactive) {
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

      if (newPastor.status === Status.Inactive) {
        throw new BadRequestException(
          `The property status in Pastor must be "active"`,
        );
      }

      //* Validate Church according supervisor
      if (!newSupervisor.theirChurch) {
        throw new BadRequestException(
          `Church was not found, verify that Supervisor has a church assigned`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newSupervisor?.theirChurch?.id },
      });

      if (newChurch.status === Status.Inactive) {
        throw new BadRequestException(
          `The property status in Church must be "active"`,
        );
      }
      // NOTE : aqui al hacer el cambio de supervisor y si este nuevo super esta asignado a otro dara un error
      // NOTE : eliminar de la antigua zona ese super y sus relaciones subordinadas, eliminar la zone del super antiguo
      // NOTE : eliminar en otras tablas segun la zona, si tiene esa zona se elimina su super.
      // NOTE : luego recien se podra asignar ese super liberado, remplazando al existente y seteando en sus subordinados que tienen esa zona
      // NOTE : cuando se actualize la zona con el nuevo super, donde tenga esta zona se setea el nuevo super y sus roles superiores.

      // tecnicamente se borra solo el super del anterior zona, a la nueva zona se le asigna el nuevo super

      // Del antiguo si es rolando se elimina de todos sus subordinados
      // Al nuevo si es marleny se elimna de todos y se setea en todos rolando.
      // Ya esta hecho el seteo nuevo solo hacer igual para el antiguo

      // Update and save
      const updatedZone = await this.zoneRepository.preload({
        id: zone.id,
        ...updateZoneDto,
        theirChurch: newChurch,
        theirPastor: newPastor,
        theirCopastor: newCopastor,
        theirSupervisor: newSupervisor,
        updatedAt: new Date(),
        updatedBy: user,
        status: status,
      });

      const oldSupervisor = await this.supervisorRepository.findOne({
        where: { id: zone?.theirSupervisor?.id },
        relations: ['theirZone'],
      });

      try {
        oldSupervisor.theirZone = null;
        await this.supervisorRepository.save(oldSupervisor);

        const savedZone = await this.zoneRepository.save(updatedZone);

        newSupervisor.theirZone = savedZone;
        await this.supervisorRepository.save(newSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? All members by module
      const allPreachers = await this.preacherRepository.find({
        relations: ['theirZone'],
      });

      const allFamilyHouses = await this.familyHouseRepository.find({
        relations: ['theirZone'],
      });

      const allDisciples = await this.discipleRepository.find({
        relations: ['theirZone'],
      });

      try {
        //* Update and set to null relationships in Preacher
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

        //* Update and set to null relationships in Family House
        const familyHousesByZone = allFamilyHouses.filter(
          (familyHouse) => familyHouse.theirZone?.id === zone?.id,
        );

        await Promise.all(
          familyHousesByZone.map(async (familyHouse) => {
            await this.familyHouseRepository.update(familyHouse.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              theirSupervisor: newSupervisor,
            });
          }),
        );

        //* Update and set to null relationships in Disciple
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
    }

    //? Update and save if is same supervisor
    const updatedZone = await this.zoneRepository.preload({
      id: zone.id,
      ...updateZoneDto,
      theirChurch: zone.theirChurch,
      theirPastor: zone.theirPastor,
      theirCopastor: zone.theirCopastor,
      theirSupervisor: zone.theirSupervisor,
      updatedAt: new Date(),
      updatedBy: user,
      status: status,
    });

    try {
      return await this.zoneRepository.save(updatedZone);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //TODO : Seguir aquí no usar el delete
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
