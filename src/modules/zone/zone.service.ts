import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, ILike, Repository } from 'typeorm';

import { RecordStatus } from '@/common/enums';
import { ZoneSearchType, ZoneSearchTypeNames } from '@/modules/zone/enums';
import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

import { zoneDataFormatter } from '@/modules/zone/helpers';
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
        `Para crear una Zona debe asignar un Supervisor.`,
      );
    }
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: theirSupervisor },
      relations: ['theirChurch', 'theirCopastor', 'theirPastor', 'theirZone'],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Supervisor con id: ${theirSupervisor} no fue encontrado.`,
      );
    }

    if (supervisor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
      );
    }

    //* Validate copastor if exists
    let copastor: Copastor | null;
    if (!supervisor?.theirCopastor) {
      copastor = null;
    }

    if (supervisor?.theirCopastor) {
      copastor = await this.copastorRepository.findOne({
        where: { id: supervisor?.theirCopastor?.id },
      });

      if (copastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
        );
      }
    }

    //* Validate and assign pastor according supervisor
    if (!supervisor?.theirPastor) {
      throw new NotFoundException(
        `Pastor no fue encontrado, verifica que Supervisor tenga un Pastor asignado.`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: supervisor?.theirPastor?.id },
    });

    if (pastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
      );
    }

    //* Validate and assign church according supervisor
    if (!supervisor?.theirChurch) {
      throw new NotFoundException(
        `Iglesia no fue encontrada, verifica que Supervisor tenga una Iglesia asignada.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: supervisor?.theirChurch?.id },
    });

    if (church?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
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
    const {
      limit,
      offset = 0,
      order = 'ASC',
      isSimpleQuery,
      churchId,
    } = paginationDto;

    if (isSimpleQuery || (isSimpleQuery && churchId)) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const zones = await this.zoneRepository.find({
          where: { theirChurch: church, recordStatus: RecordStatus.Active },
          relations: ['familyGroups'],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return zones;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    try {
      const zones = await this.zoneRepository.find({
        where: { recordStatus: RecordStatus.Active },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor.member',
          'theirCopastor.member',
          'theirSupervisor.member',
          'familyGroups',
          'preachers.member',
          'disciples.member',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (zones.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return zoneDataFormatter({ zones }) as any;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<Zone[]> {
    const {
      'search-type': searchType,
      limit,
      offset = 0,
      order,
    } = searchTypeAndPaginationDto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido.`);
    }

    //? Find by zone name --> Many
    if (term && searchType === ZoneSearchType.ZoneName) {
      try {
        const zones = await this.zoneRepository.find({
          where: {
            zoneName: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con este nombre: ${term}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by country --> Many
    if (term && searchType === ZoneSearchType.Country) {
      try {
        const zones = await this.zoneRepository.find({
          where: {
            country: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con este país: ${term}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by department --> Many
    if (term && searchType === ZoneSearchType.Department) {
      try {
        const zones = await this.zoneRepository.find({
          where: {
            department: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con este departamento: ${term}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by province --> Many
    if (term && searchType === ZoneSearchType.Province) {
      try {
        const zones = await this.zoneRepository.find({
          where: {
            province: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con esta provincia: ${term}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by district --> Many
    if (term && searchType === ZoneSearchType.District) {
      try {
        const zones = await this.zoneRepository.find({
          where: {
            district: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con este distrito: ${term}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by status --> Many
    if (term && searchType === ZoneSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      try {
        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        const zones = await this.zoneRepository.find({
          where: {
            recordStatus: recordStatusTerm,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron zonas con este estado de registro: ${value}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //! General Exceptions
    if (
      term &&
      !Object.values(ZoneSearchType).includes(searchType as ZoneSearchType)
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(ZoneSearchTypeNames).join(', ')}`,
      );
    }
  }

  //* UPDATE ZONE
  async update(
    id: string,
    updateZoneDto: UpdateZoneDto,
    user: User,
  ): Promise<Zone> {
    const { recordStatus, theirSupervisor, newTheirSupervisor } = updateZoneDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    //* Validation zone
    const zone = await this.zoneRepository.findOne({
      where: { id: id },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'preachers',
        'familyGroups',
        'disciples',
      ],
    });

    if (!zone) {
      throw new NotFoundException(`Zona con id: ${id} no fue encontrado.`);
    }

    if (
      zone?.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }

    //! Exchange of supervisor between zones
    //? Update Zone if their Supervisor is different
    if (newTheirSupervisor && zone.theirSupervisor?.id !== newTheirSupervisor) {
      //* Validate new supervisor
      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: newTheirSupervisor },
        relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
      });

      if (!newSupervisor) {
        throw new NotFoundException(
          `Supervisor con id:  ${newTheirSupervisor} no fue encontrado.`,
        );
      }

      if (newSupervisor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
        );
      }

      //? Validation relation exists in current zone
      //* Supervisor
      if (!zone?.theirSupervisor) {
        throw new BadRequestException(
          `Supervisor no fue encontrado, verifica que la Zona actual tenga un Supervisor asignado.`,
        );
      }

      const supervisor = await this.supervisorRepository.findOne({
        where: { id: zone?.theirSupervisor?.id },
        relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
      });

      if (supervisor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la relación de Supervisor del Zona actual debe ser "Activo".`,
        );
      }

      //* Co-Pastor
      if (!zone?.theirCopastor) {
        throw new BadRequestException(
          `Co-Pastor no fue encontrado, verifica que la Zona actual tenga un Co-Pastor asignado.`,
        );
      }

      const copastor = await this.copastorRepository.findOne({
        where: { id: zone?.theirCopastor?.id },
      });

      if (copastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la relación de Co-Pastor del Zona actual debe ser "Activo".`,
        );
      }

      //* Pastor
      if (!zone?.theirPastor) {
        throw new BadRequestException(
          `Pastor no fue encontrado, verifica que la Zona actual tenga un Pastor asignado.`,
        );
      }

      const pastor = await this.pastorRepository.findOne({
        where: { id: zone?.theirPastor?.id },
      });

      if (pastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la relación de Pastor del Zona actual debe ser "Activo".`,
        );
      }

      //* Church
      if (!zone?.theirChurch) {
        throw new BadRequestException(
          `Iglesia no fue encontrada, verifica que la Zona actual tenga una Iglesia asignada.`,
        );
      }

      const church = await this.churchRepository.findOne({
        where: { id: zone?.theirChurch?.id },
      });

      if (church?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la relación de Iglesia de la Zona actual debe ser "Activo".`,
        );
      }

      //! Validation same relations between new and current zone
      if (zone?.theirCopastor?.id !== newSupervisor.theirCopastor?.id) {
        throw new BadRequestException(
          `Para actualizar de Supervisor esta Zona, el Co-Pastor del nuevo Supervisor debe ser el mismo que el de la Zona.`,
        );
      }

      if (zone?.theirPastor?.id !== newSupervisor.theirPastor?.id) {
        throw new BadRequestException(
          `Para actualizar de Supervisor esta Zona, el Pastor del nuevo Supervisor debe ser el mismo que la de la Zona.`,
        );
      }

      if (zone?.theirChurch?.id !== newSupervisor.theirChurch?.id) {
        throw new BadRequestException(
          `Para actualizar de Supervisor esta Zona, la Iglesia del nuevo Supervisor debe ser la misma que la de la Zona.`,
        );
      }

      //? Validate new supervisor
      //* Validate Copastor according new supervisor
      if (!newSupervisor?.theirCopastor) {
        throw new BadRequestException(
          `No se encontró el Co-Pastor, verifica que Supervisor tenga un Co-Pastor asignado.`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newSupervisor?.theirCopastor?.id },
      });

      if (newCopastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
        );
      }

      //* Validate Pastor according new supervisor
      if (!newSupervisor?.theirPastor) {
        throw new BadRequestException(
          `No se encontró el Pastor, verifica que Supervisor tenga un Pastor asignado.`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newSupervisor?.theirPastor?.id },
      });

      if (newPastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
        );
      }

      //* Validate Church according new supervisor
      if (!newSupervisor?.theirChurch) {
        throw new BadRequestException(
          `No se encontró la Iglesia, verifica que Supervisor tenga una Iglesia asignada.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newSupervisor?.theirChurch?.id },
      });

      if (newChurch?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }

      //! Exchange of supervisors and family groups and disciples between zones
      //* Current Values
      const currentZoneSupervisor = supervisor;
      const currentZonePreachers = zone?.preachers?.map((preacher) => preacher);
      const currentZoneFamilyGroups = zone?.familyGroups?.map(
        (familyGroup) => familyGroup,
      );
      const currentZoneDisciples = zone?.disciples?.map((disciple) => disciple);

      //* New values
      if (!newSupervisor?.theirZone) {
        throw new BadRequestException(
          `Ese necesario tener un grupo familiar asignado en el nuevo predicador, para poder intercambiarlos.`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: newSupervisor?.theirZone?.id },
        relations: [
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'preachers',
          'familyGroups',
          'disciples',
        ],
      });

      if (!newZone) {
        throw new BadRequestException(
          `Zona con id: ${newSupervisor?.theirZone?.id} no fue encontrado`,
        );
      }

      if (zone?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la nueva zona debe ser "Activo".`,
        );
      }

      const newZoneSupervisor = newSupervisor;
      const newZoneFamilyGroups = newZone?.familyGroups?.map(
        (familyGroups) => familyGroups,
      );
      const newZonePreachers = newZone?.preachers?.map((preacher) => preacher);
      const newZoneDisciples = newZone?.disciples?.map((disciple) => disciple);

      //! Remove relationships from current zone and supervisor
      //* Supervisor
      try {
        const updateCurrentSupervisor = await this.supervisorRepository.preload(
          {
            id: zone?.theirSupervisor?.id,
            theirZone: null,
            updatedAt: new Date(),
            updatedBy: user,
            recordStatus: recordStatus,
          },
        );

        await this.supervisorRepository.save(updateCurrentSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Zone
      try {
        const updateCurrentZone = await this.zoneRepository.preload({
          id: zone?.id,
          theirSupervisor: null,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });
        await this.zoneRepository.save(updateCurrentZone);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //! Remove relationships from new family group and preacher
      //* Supervisor
      try {
        const updateNewSupervisor = await this.supervisorRepository.preload({
          id: newZone?.theirSupervisor?.id,
          theirZone: null,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });
        await this.supervisorRepository.save(updateNewSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Zone
      try {
        const updateNewZone = await this.zoneRepository.preload({
          id: newZone?.id,
          theirSupervisor: null,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });
        await this.zoneRepository.save(updateNewZone);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Set the new supervisor and zone to the current values
      try {
        const updateCurrentZone = await this.zoneRepository.preload({
          id: zone?.id,
          theirSupervisor: newZoneSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        await this.zoneRepository.save(updateCurrentZone);

        const updateCurrentSupervisor = await this.supervisorRepository.preload(
          {
            id: zone?.theirSupervisor?.id,
            theirZone: newZone,
            updatedAt: new Date(),
            updatedBy: user,
            recordStatus: recordStatus,
          },
        );

        await this.supervisorRepository.save(updateCurrentSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Set the current supervisor and zone to the new values
      try {
        const updateNewZone = await this.zoneRepository.preload({
          id: newZone?.id,
          theirSupervisor: currentZoneSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        await this.zoneRepository.save(updateNewZone);

        const updateNewSupervisor = await this.supervisorRepository.preload({
          id: newZone?.theirSupervisor?.id,
          theirZone: zone,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        await this.supervisorRepository.save(updateNewSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Update relationships subordinate in zone
      //* Preacher
      try {
        await Promise.all(
          newZonePreachers?.map(async (preacher) => {
            await this.preacherRepository.update(preacher?.id, {
              theirSupervisor: currentZoneSupervisor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }

      try {
        await Promise.all(
          currentZonePreachers?.map(async (preacher) => {
            await this.preacherRepository.update(preacher?.id, {
              theirSupervisor: newZoneSupervisor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Family groups
      try {
        await Promise.all(
          newZoneFamilyGroups?.map(async (familyGroup) => {
            await this.familyGroupRepository.update(familyGroup?.id, {
              theirSupervisor: currentZoneSupervisor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }

      try {
        await Promise.all(
          currentZoneFamilyGroups?.map(async (familyGroup) => {
            await this.familyGroupRepository.update(familyGroup?.id, {
              theirSupervisor: newZoneSupervisor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Disciples
      try {
        await Promise.all(
          newZoneDisciples?.map(async (disciple) => {
            await this.discipleRepository.update(disciple?.id, {
              theirSupervisor: currentZoneSupervisor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }

      try {
        await Promise.all(
          currentZoneDisciples?.map(async (disciple) => {
            await this.discipleRepository.update(disciple?.id, {
              theirSupervisor: newZoneSupervisor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is same supervisor
    if (
      !newTheirSupervisor &&
      updateZoneDto?.theirSupervisor === zone.theirSupervisor?.id
    ) {
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

      //* Update and set new zone name and code in Family Group (if change name zone)
      const familyGroupsByZone = allFamilyGroups.filter(
        (familyGroup) => familyGroup?.theirZone?.id === zone?.id,
      );

      try {
        await Promise.all(
          familyGroupsByZone.map(async (familyGroup) => {
            const number = familyGroup.familyGroupCode.split('-')[1];

            await this.familyGroupRepository.update(familyGroup?.id, {
              theirChurch: zone.theirChurch,
              theirPastor: zone.theirPastor,
              theirCopastor: zone.theirCopastor,
              theirSupervisor: zone.theirSupervisor,
              familyGroupCode: `${updateZoneDto.zoneName.toUpperCase()}-${number}`,
              updatedAt: new Date(),
              updatedBy: user,
              recordStatus: recordStatus,
            });
          }),
        );

        return await this.zoneRepository.save(updatedZone);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is different Supervisor and newSupervisor not exists
    if (
      !newTheirSupervisor &&
      updateZoneDto?.theirSupervisor !== zone.theirSupervisor?.id
    ) {
      //* Validation preacher
      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: theirSupervisor },
        relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
      });

      if (!newSupervisor) {
        throw new NotFoundException(
          `Supervisor con id: ${theirSupervisor} no fue encontrado.`,
        );
      }

      if (!newSupervisor?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en Supervisor debe ser "Activo".`,
        );
      }

      //* Validation relation exists in new Preacher
      // Copastor
      if (!newSupervisor?.theirCopastor) {
        throw new NotFoundException(
          `Co-Pastor no fue encontrado, verifica que el nuevo Supervisor tenga un Co-Pastor asignado.`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newSupervisor?.theirCopastor?.id },
      });

      if (newCopastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en el nuevo Co-Pastor debe ser "Activo".`,
        );
      }

      // Pastor
      if (!newSupervisor?.theirPastor) {
        throw new NotFoundException(
          `Pastor no fue encontrado, verifica que el nuevo Supervisor tenga un Pastor asignado.`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newSupervisor?.theirPastor?.id },
      });

      if (newPastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en el nuevo Pastor debe ser "Activo".`,
        );
      }

      // Church
      if (!newSupervisor?.theirChurch) {
        throw new NotFoundException(
          `Iglesia no fue encontrada, verifica que el nuevo Supervisor tenga una Iglesia asignada.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newSupervisor?.theirChurch?.id },
      });

      if (newChurch?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la nueva Iglesia debe ser "Activo".`,
        );
      }

      try {
        const updatedZone = await this.zoneRepository.preload({
          id: zone?.id,
          ...updateZoneDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        //* Set relationship in preacher according their zone
        newSupervisor.theirZone = updatedZone;
        await this.supervisorRepository.save(newSupervisor);

        return await this.zoneRepository.save(updatedZone);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  // TODO : revisar todos los comentario de delete si seran necesario almenos en membrsesia si.
  //! DELETE ZONE
  async remove(id: string, user: User): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: id },
      relations: ['theirSupervisor'],
    });

    if (!zone) {
      throw new NotFoundException(`Zona con id: ${id} no fue encontrado.`);
    }

    //* Update and set in Inactive on Zone
    try {
      const updatedZone = await this.zoneRepository.preload({
        id: zone.id,
        // theirChurch: null,
        // theirPastor: null,
        // theirCopastor: null,
        // theirSupervisor: null,
        updatedAt: new Date(),
        updatedBy: user,
        recordStatus: RecordStatus.Inactive,
      });

      await this.zoneRepository.save(updatedZone);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in supervisor
    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirZone'],
    });

    try {
      const supervisorsZone = allSupervisors.filter(
        (supervisor) => supervisor.theirZone?.id === zone?.id,
      );

      await Promise.all(
        supervisorsZone.map(async (supervisor) => {
          await this.supervisorRepository.update(supervisor?.id, {
            theirZone: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    //* Preachers
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirZone'],
    });

    try {
      const preachersByZone = allPreachers.filter(
        (preacher) => preacher.theirZone?.id === zone?.id,
      );

      await Promise.all(
        preachersByZone.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirZone: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //* Family Groups
    const allFamilyGroups = await this.familyGroupRepository.find({
      relations: ['theirZone'],
    });

    try {
      const familyGroupsByZone = allFamilyGroups.filter(
        (familyGroup) => familyGroup.theirZone?.id === zone?.id,
      );

      await Promise.all(
        familyGroupsByZone.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup?.id, {
            theirZone: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //* Disciples
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirZone'],
    });

    try {
      const disciplesByZone = allDisciples.filter(
        (disciple) => disciple.theirZone?.id === zone?.id,
      );

      await Promise.all(
        disciplesByZone.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirZone: null,
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
    if (error.code === '23505') {
      const detail = error.detail;

      if (detail.includes('Key')) {
        throw new BadRequestException(
          `El supervisor ya esta siendo utilizado por otra zona, elige otro.`,
        );
      }
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador y que revise los registros de consola.',
    );
  }
}
