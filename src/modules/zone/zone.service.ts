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

    //* Validate relations
    if (!supervisor?.theirCopastor) {
      throw new NotFoundException(
        `Co-Pastor no fue encontrado, verifica que Supervisor tenga un Co-Pastor asignado.`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: supervisor?.theirCopastor?.id },
    });

    if (copastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
      );
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
    const { limit, offset = 0, order = 'ASC' } = paginationDto;

    const zones = await this.zoneRepository.find({
      where: { recordStatus: RecordStatus.Active },
      take: limit,
      skip: offset,
      relations: [
        'updatedBy',
        'createdBy',
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'familyGroups',
        'preachers',
        'disciples',
      ],
      relationLoadStrategy: 'query',
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (zones.length === 0) {
      throw new NotFoundException(`No se encontraron zonas.`);
    }

    try {
      return zoneDataFormatter({ zones }) as any;
    } catch (error) {
      throw new BadRequestException(
        `Ocurrió un error, habla con el administrador`,
      );
    }
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<Zone | Zone[]> {
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
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'familyGroups',
          'preachers',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (zones.length === 0) {
        throw new NotFoundException(
          `No se encontraron zonas con este nombre: ${term}`,
        );
      }

      try {
        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by country --> Many
    if (term && searchType === ZoneSearchType.Country) {
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
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'familyGroups',
          'preachers',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (zones.length === 0) {
        throw new NotFoundException(
          `No se encontraron zonas con este país: ${term}`,
        );
      }

      try {
        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by department --> Many
    if (term && searchType === ZoneSearchType.Department) {
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
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'familyGroups',
          'preachers',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (zones.length === 0) {
        throw new NotFoundException(
          `No se encontraron zonas con este departamento: ${term}`,
        );
      }

      try {
        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by province --> Many
    if (term && searchType === ZoneSearchType.Province) {
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
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'familyGroups',
          'preachers',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (zones.length === 0) {
        throw new NotFoundException(
          `No se encontraron zonas con esta provincia: ${term}`,
        );
      }

      try {
        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by district --> Many
    if (term && searchType === ZoneSearchType.District) {
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
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'familyGroups',
          'preachers',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (zones.length === 0) {
        throw new NotFoundException(
          `No se encontraron zonas con este distrito: ${term}`,
        );
      }

      try {
        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by status --> Many
    if (term && searchType === ZoneSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
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
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'familyGroups',
          'preachers',
          'disciples',
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

      try {
        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
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
    const { recordStatus, newTheirSupervisor } = updateZoneDto;

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

    //? Update Zone if their Supervisor is different
    if (newTheirSupervisor && zone.theirSupervisor?.id !== newTheirSupervisor) {
      if (!newTheirSupervisor) {
        throw new NotFoundException(
          `Para poder actualizar una Zona, se le debe asignar un Supervisor.`,
        );
      }

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

      //* Validate Copastor according supervisor
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

      //* Validate Pastor according supervisor
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

      //* Validate Church according supervisor
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

      // TODO : revisar aqui si es necesario el query para la búsqueda.

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
          theirCopastor: newCopastor,
          theirPastor: newPastor,
          theirChurch: newChurch,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        await this.zoneRepository.save(updateCurrentZone);

        const updateCurrentSupervisor = await this.supervisorRepository.preload(
          {
            id: zone?.theirSupervisor?.id,
            theirZone: newZone,
            theirCopastor: newCopastor,
            theirPastor: newPastor,
            theirChurch: newChurch,
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
          theirCopastor: copastor,
          theirPastor: pastor,
          theirChurch: church,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        await this.zoneRepository.save(updateNewZone);

        const updateNewSupervisor = await this.supervisorRepository.preload({
          id: newZone?.theirSupervisor?.id,
          theirZone: zone,
          theirCopastor: copastor,
          theirPastor: pastor,
          theirChurch: church,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        await this.supervisorRepository.save(updateNewSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Exchange
      //? Update relationships subordinate in zone
      //* Preacher
      try {
        await Promise.all(
          newZonePreachers?.map(async (preacher) => {
            await this.preacherRepository.update(preacher?.id, {
              theirZone: zone,
              theirSupervisor: newZoneSupervisor,
              theirCopastor: copastor,
              theirPastor: pastor,
              theirChurch: church,
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
              theirZone: newZone,
              theirSupervisor: currentZoneSupervisor, // Se mantiene su supervisor solo cambia sus superiores
              theirCopastor: newCopastor,
              theirPastor: newPastor,
              theirChurch: newChurch,
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
            const number = familyGroup.familyGroupCode.split('-')[1];

            await this.familyGroupRepository.update(familyGroup?.id, {
              theirZone: zone,
              theirSupervisor: newZoneSupervisor,
              theirCopastor: copastor,
              theirPastor: pastor,
              theirChurch: church,
              familyGroupCode: `${zone.zoneName.toUpperCase()}-${number}`,
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
            const number = familyGroup.familyGroupCode.split('-')[1];

            await this.familyGroupRepository.update(familyGroup?.id, {
              theirZone: newZone,
              theirSupervisor: currentZoneSupervisor,
              theirCopastor: newCopastor,
              theirPastor: newPastor,
              theirChurch: newChurch,
              familyGroupCode: `${newZone.zoneName.toUpperCase()}-${number}`,
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
              theirZone: zone,
              theirSupervisor: newZoneSupervisor,
              theirCopastor: copastor,
              theirPastor: pastor,
              theirChurch: church,
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
              theirZone: newZone,
              theirSupervisor: currentZoneSupervisor,
              theirCopastor: newCopastor,
              theirPastor: newPastor,
              theirChurch: newChurch,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is same supervisor and zone
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

      //* Update and set new zone name and code in Family House
      const familyGroupsByZone = allFamilyGroups.filter(
        (familyGroup) => familyGroup?.theirZone?.id === zone?.id,
      );

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

      try {
        return await this.zoneRepository.save(updatedZone);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //! DELETE ZONE (No se eliminara o se pondrá inactiva la zona ara que no afecte relaciones en otras tablas)
  // TODO : si se inactiva no se encontrara esta zona al crear una ofrenda pero no se eliminara solo se inactiva.
  // TODO : igual que el grupo familiar, se mantiene pero se oculta al crear ofrenda porque esta inactivo
  // TODO : en members si se eliminaria al subir dee nivel si ese id conincide con el de la ofrenda segun su member type se cambia y se actyaliza todos los registros.
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
      'Sucedió un error inesperado, revise los registros de consola',
    );
  }
}
