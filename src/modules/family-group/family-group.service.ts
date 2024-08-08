import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, ILike, In, Repository } from 'typeorm';

import { RecordStatus, SearchSubType, SearchType } from '@/common/enums';
import { PaginationDto, SearchByTypeAndPaginationDto } from '@/common/dtos';

import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
} from '@/modules/family-group/dto';
import { FamilyGroup } from '@/modules/family-group/entities';
import { formatDataFamilyGroup } from '@/modules/family-group/helpers';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';

@Injectable()
export class FamilyGroupService {
  private readonly logger = new Logger('FamilyGroupService');

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

  //* CREATE FAMILY HOME
  async create(
    createFamilyGroupDto: CreateFamilyGroupDto,
    user: User,
  ): Promise<FamilyGroup> {
    const { theirPreacher } = createFamilyGroupDto;

    //? Find and validate Preacher
    if (!theirPreacher) {
      throw new NotFoundException(
        `Para crear un nuevo grupo familiar, se debe asignar un Predicador.`,
      );
    }

    const preacher = await this.preacherRepository.findOne({
      where: { id: theirPreacher },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirZone',
      ],
    });

    if (!preacher) {
      throw new NotFoundException(
        `Predicador con id: ${theirPreacher} no fue encontrado.`,
      );
    }

    if (preacher.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Predicador debe ser "Activo".`,
      );
    }

    //* Validation if relationships exist
    // Supervisor
    if (!preacher?.theirSupervisor) {
      throw new NotFoundException(
        `Supervisor no fue encontrado, verifica que Predicador tenga un Supervisor asignado.`,
      );
    }

    const supervisor = await this.supervisorRepository.findOne({
      where: { id: preacher?.theirSupervisor?.id },
    });

    if (supervisor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Supervisor debe ser "Activo".`,
      );
    }

    // Zone
    if (!preacher?.theirZone) {
      throw new NotFoundException(
        `Zona no fue encontrada, verifica que Predicador tenga una Zona asignada.`,
      );
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: preacher?.theirZone?.id },
    });

    if (supervisor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Zona debe ser "Activo".`,
      );
    }

    // Copastor
    if (!preacher?.theirCopastor) {
      throw new NotFoundException(
        `Co-Pastor no fue encontrado, verifica que Predicador tenga un Co-Pastor asignado.`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: preacher?.theirCopastor?.id },
    });

    if (copastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Co-Pastor debe ser "Activo".`,
      );
    }

    // Pastor
    if (!preacher?.theirPastor) {
      throw new NotFoundException(
        `Pastor no fue encontrado, verifica que Predicador tenga un Pastor asignado.`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: preacher?.theirPastor?.id },
    });

    if (pastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Pastor debe ser "Activo".`,
      );
    }

    // Church
    if (!preacher.theirChurch) {
      throw new NotFoundException(
        `Iglesia no fue encontrada, verifica que Predicador tenga una Iglesia asignada.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: preacher?.theirChurch?.id },
    });

    if (church.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Iglesia debe ser "Activo".`,
      );
    }

    //? Assignment of number and code to the family group
    const allFamilyGroups = await this.familyGroupRepository.find({
      relations: ['theirZone'],
    });
    const allFamilyGroupsByZone = allFamilyGroups.filter(
      (familyGroup) => familyGroup.theirZone?.id === zone?.id,
    );

    let familyGroupNumber: number;
    let familyGroupCode: string;

    if (allFamilyGroupsByZone.length === 0) {
      familyGroupNumber = 1;
      familyGroupCode = `${zone.zoneName.toUpperCase()}-${familyGroupNumber}`;
    }

    if (allFamilyGroupsByZone.length !== 0) {
      familyGroupNumber = allFamilyGroupsByZone.length + 1;
      familyGroupCode = `${zone.zoneName.toUpperCase()}-${familyGroupNumber}`;
    }

    //* Create new instance
    try {
      const newFamilyGroup = this.familyGroupRepository.create({
        ...createFamilyGroupDto,
        familyGroupNumber: familyGroupNumber,
        familyGroupCode: familyGroupCode,
        theirChurch: church,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirSupervisor: supervisor,
        theirPreacher: preacher,
        theirZone: zone,
        createdAt: new Date(),
        createdBy: user,
      });

      const savedFamilyGroup =
        await this.familyGroupRepository.save(newFamilyGroup);

      // Set relationship in preacher according their family group
      preacher.theirFamilyGroup = savedFamilyGroup;
      await this.preacherRepository.save(preacher);

      return savedFamilyGroup;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit, offset = 0, order = 'ASC' } = paginationDto;

    const familyGroups = await this.familyGroupRepository.find({
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
        'theirZone',
        'theirPreacher',
        'disciples',
      ],
      relationLoadStrategy: 'query',
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (familyGroups.length === 0) {
      throw new NotFoundException(`No se encontraron grupos familiares`);
    }

    try {
      return formatDataFamilyGroup({ familyGroups }) as any;
    } catch (error) {
      throw new BadRequestException(
        `Ocurrió un error, habla con el administrador`,
      );
    }
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchByTypeAndPaginationDto,
  ): Promise<FamilyGroup | FamilyGroup[]> {
    const {
      'search-type': searchType,
      'search-sub-type': searchSubType,
      limit,
      offset = 0,
      order,
    } = searchTypeAndPaginationDto;

    //? Find by first name () --> Many
    //* FamilyGroups by preacher names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.FamilyGroupByPreacherNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const preachers = await this.preacherRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const preachersId = preachers.map((preacher) => preacher.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirPreacher: In(preachersId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los nombres de su predicador: ${firstNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Family groups by supervisor names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.FamilyGroupBySupervisorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const supervisorsId = supervisors.map((supervisor) => supervisor.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirSupervisor: In(supervisorsId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los nombres de su supervisor: ${firstNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Family groups by co-pastor names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.FamilyGroupByCopastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const copastors = await this.copastorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const copastorsId = copastors.map((copastor) => copastor.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirCopastor: In(copastorsId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los nombres de su co-pastor: ${firstNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Family groups by pastor names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.FamilyGroupByPastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const pastors = await this.pastorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const pastorsId = pastors.map((pastor) => pastor.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirPastor: In(pastorsId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los nombres de su pastor: ${firstNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by last name --> Many
    //* Family Groups by preacher last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.FamilyGroupByPreacherLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const preachers = await this.preacherRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const preacherId = preachers.map((preacher) => preacher.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirPreacher: In(preacherId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los apellidos de su predicador: ${lastNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Family groups by supervisor last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.FamilyGroupBySupervisorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const supervisorsId = supervisors.map((supervisor) => supervisor.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirSupervisor: In(supervisorsId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los apellidos de su supervisor: ${lastNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Grupos familiares by co-pastor last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.FamilyGroupByCopastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const copastors = await this.copastorRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const copastorsId = copastors.map((copastor) => copastor.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirCopastor: In(copastorsId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los apellidos de su co-pastor: ${lastNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Family groups by pastor last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.FamilyGroupByPastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const pastors = await this.pastorRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const pastorsId = pastors.map((pastor) => pastor.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirPastor: In(pastorsId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los apellidos de su pastor: ${lastNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by full name --> Many
    //* Family groups by preacher full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.FamilyGroupByPreacherFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const preachers = await this.preacherRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const preachersId = preachers.map((preacher) => preacher.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirPreacher: In(preachersId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los nombres y apellidos de su predicador: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Family groups by supervisor full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.FamilyGroupBySupervisorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const supervisorsId = supervisors.map((supervisor) => supervisor.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirSupervisor: In(supervisorsId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los nombres y apellidos de su supervisor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Family groups by co-pastor full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.FamilyGroupByCopastorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const copastors = await this.copastorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const copastorsId = copastors.map((copastor) => copastor.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirCopastor: In(copastorsId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los nombres y apellidos de su co-pastor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Family groups by pastor full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.FamilyGroupByPastorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const pastors = await this.pastorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const pastorsId = pastors.map((pastor) => pastor.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirPastor: In(pastorsId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares por los nombres y apellidos de su pastor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by family-group-code --> Many
    if (term && searchType === SearchType.FamilyGroupCode) {
      const familyGroups = await this.familyGroupRepository.find({
        where: {
          familyGroupCode: ILike(`%${term}%`),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares con este código: ${term}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by family-group-name --> Many
    if (term && searchType === SearchType.FamilyGroupName) {
      const familyGroups = await this.familyGroupRepository.find({
        where: {
          familyGroupName: ILike(`%${term}%`),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares con este nombre: ${term}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by zone name --> Many
    if (term && searchType === SearchType.ZoneName) {
      const zones = await this.zoneRepository.find({
        where: {
          zoneName: ILike(`%${term}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const zonesId = zones.map((zone) => zone.id);

      const familyGroups = await this.familyGroupRepository.find({
        where: {
          theirZone: In(zonesId),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares con esta zona: ${term}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by department --> Many
    if (term && searchType === SearchType.Department) {
      const familyGroups = await this.familyGroupRepository.find({
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares con este departamento: ${term}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by province --> Many
    if (term && searchType === SearchType.Province) {
      const familyGroups = await this.familyGroupRepository.find({
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares con esta provincia: ${term}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by district --> Many
    if (term && searchType === SearchType.District) {
      const familyGroups = await this.familyGroupRepository.find({
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares con este distrito: ${term}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === SearchType.UrbanSector) {
      const familyGroups = await this.familyGroupRepository.find({
        where: {
          urbanSector: ILike(`%${term}%`),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares con este sector urbano: ${term}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by address --> Many
    if (term && searchType === SearchType.Address) {
      const familyGroups = await this.familyGroupRepository.find({
        where: {
          address: ILike(`%${term}%`),
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No se encontraron grupos familiares con esta dirección: ${term}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by status --> Many
    if (term && searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      const familyGroups = await this.familyGroupRepository.find({
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
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

        throw new NotFoundException(
          `No se encontraron grupos familiares con este estado: ${value}`,
        );
      }

      try {
        return formatDataFamilyGroup({ familyGroups }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //! General Exceptions
    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es obligatorio`);
    }

    if (term && !Object.values(SearchType).includes(searchType as SearchType)) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(SearchType).join(', ')}`,
      );
    }

    if (
      term &&
      (SearchType.FirstName || SearchType.LastName || SearchType.FullName)
    ) {
      throw new BadRequestException(
        `Para buscar por nombres o apellidos el sub-tipo es requerido`,
      );
    }
  }

  //* UPDATE FAMILY HOUSE
  async update(
    id: string,
    updateFamilyGroupDto: UpdateFamilyGroupDto,
    user: User,
  ): Promise<FamilyGroup> {
    const { recordStatus, newTheirPreacher } = updateFamilyGroupDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    // TODO : hacer esta validacion dentro del new preacher porque si quiero volver a activar una casa
    // TODO : chocara con estas validaciones (revisar), lo mismo para zona
    //* Validation current family group
    const familyGroup = await this.familyGroupRepository.findOne({
      where: { id: id },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirZone',
        'theirPreacher',
        'disciples',
      ],
    });

    if (!familyGroup) {
      throw new NotFoundException(
        `Grupo Familiar con id: ${id} no fue encontrado`,
      );
    }

    if (
      familyGroup.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }

    //* Validation relation exists in current Family group
    // Preacher
    if (!familyGroup?.theirPreacher) {
      throw new BadRequestException(
        `1Predicador no fue encontrado, verifica que el Grupo Familiar actual tenga un Predicador asignado.`,
      );
    }

    if (familyGroup?.theirPreacher?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en la relación de Predicador del Grupo Familiar actual debe ser "Activo".`,
      );
    }

    // Supervisor
    if (!familyGroup?.theirSupervisor) {
      throw new BadRequestException(
        `Supervisor no fue encontrado, verifica que el Grupo Familiar actual tenga un Supervisor asignado.`,
      );
    }

    if (familyGroup?.theirSupervisor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en la relación de Supervisor del Grupo Familiar actual debe ser "Activo".`,
      );
    }

    // Zone
    if (!familyGroup?.theirZone) {
      throw new BadRequestException(
        `Zona no fue encontrada, verifica que el Grupo Familiar actual tenga una Zona asignada.`,
      );
    }

    if (familyGroup?.theirZone?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en la relación de Zona del Grupo Familiar actual debe ser "Activo".`,
      );
    }

    // Co-Pastor
    if (!familyGroup?.theirCopastor) {
      throw new BadRequestException(
        `Co-Pastor no fue encontrado, verifica que el Grupo Familiar actual tenga un Co-Pastor asignado.`,
      );
    }

    if (familyGroup?.theirCopastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en la relación de Co-Pastor del Grupo Familiar actual debe ser "Activo".`,
      );
    }

    // Pastor
    if (!familyGroup?.theirPastor) {
      throw new BadRequestException(
        `Pastor no fue encontrado, verifica que el Grupo Familiar actual tenga un Pastor asignado.`,
      );
    }

    if (familyGroup?.theirPastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en la relación de Pastor del Grupo Familiar actual debe ser "Activo".`,
      );
    }

    // Church
    if (!familyGroup?.theirChurch) {
      throw new BadRequestException(
        `Iglesia no fue encontrada, verifica que el Grupo Familiar actual tenga una Iglesia asignada.`,
      );
    }

    if (familyGroup?.theirChurch?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en la relación de Iglesia del Grupo Familiar actual debe ser "Activo".`,
      );
    }

    //* Validation new preacher
    const newPreacher = await this.preacherRepository.findOne({
      where: { id: newTheirPreacher },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirZone',
        'theirFamilyGroup',
      ],
    });

    if (!newPreacher) {
      throw new NotFoundException(
        `Predicador con id: ${newTheirPreacher} no fue encontrado.`,
      );
    }

    if (!newPreacher.recordStatus) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Predicador debe ser "Activo".`,
      );
    }

    //* Validation same relations
    if (familyGroup.theirZone?.id !== newPreacher.theirZone?.id) {
      throw new BadRequestException(
        `Para actualizar de Predicador este Grupo Familiar, la zona del nuevo Predicador debe ser la misma que la del Grupo Familiar.`,
      );
    }

    if (familyGroup.theirSupervisor?.id !== newPreacher.theirSupervisor?.id) {
      throw new BadRequestException(
        `Para actualizar de Predicador este Grupo Familiar, el supervisor del nuevo Predicador debe ser el mismo que la del Grupo Familiar.`,
      );
    }

    if (familyGroup.theirCopastor?.id !== newPreacher.theirCopastor?.id) {
      throw new BadRequestException(
        `Para actualizar de Predicador este Grupo Familiar, el co-pastor del nuevo Predicador debe ser el mismo que la del Grupo Familiar.`,
      );
    }

    if (familyGroup.theirPastor?.id !== newPreacher.theirPastor?.id) {
      throw new BadRequestException(
        `Para actualizar de Predicador este Grupo Familiar, el pastor del nuevo Predicador debe ser el mismo que la del Grupo Familiar.`,
      );
    }

    if (familyGroup.theirChurch?.id !== newPreacher.theirChurch?.id) {
      throw new BadRequestException(
        `Para actualizar de Predicador este Grupo Familiar, la iglesia del nuevo Predicador debe ser la misma que la del Grupo Familiar.`,
      );
    }

    //? Update if new preacher exits and is different but zone is same
    if (
      newTheirPreacher &&
      familyGroup.theirPreacher.id !== newPreacher.id &&
      familyGroup.theirZone.id === newPreacher.theirZone.id
    ) {
      //* Validate Preacher
      if (!newTheirPreacher) {
        throw new NotFoundException(
          `Para poder actualizar un Grupo Familiar, se debe asignar un Predicador.`,
        );
      }

      //* Validation relation exists in new Preacher
      // Supervisor
      if (!newPreacher?.theirSupervisor) {
        throw new NotFoundException(
          `Supervisor no fue encontrado, verifica que el nuevo Predicador tenga un Supervisor asignado.`,
        );
      }

      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: newPreacher?.theirSupervisor?.id },
      });

      if (newSupervisor.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en el nuevo Supervisor debe ser "Activo".`,
        );
      }

      // Zone
      if (!newPreacher?.theirZone) {
        throw new NotFoundException(
          `Zona no fue encontrada, verifica que el nuevo Predicador tenga una Zona asignada.`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: newPreacher?.theirZone?.id },
      });

      if (newZone.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la nueva Zona debe ser "Activo".`,
        );
      }

      // Copastor
      if (!newPreacher?.theirCopastor) {
        throw new NotFoundException(
          `Co-Pastor no fue encontrado, verifica que el nuevo Predicador tenga un Co-Pastor asignado.`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newPreacher?.theirCopastor?.id },
      });

      if (newCopastor.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en el nuevo Co-Pastor debe ser "Activo".`,
        );
      }

      // Pastor
      if (!newPreacher?.theirPastor) {
        throw new NotFoundException(
          `Pastor no fue encontrado, verifica que el nuevo Predicador tenga un Pastor asignado.`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newPreacher?.theirPastor?.id },
      });

      if (newPastor.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en el nuevo Pastor debe ser "Activo".`,
        );
      }

      // Church
      if (!newPreacher?.theirChurch) {
        throw new NotFoundException(
          `Iglesia no fue encontrada, verifica que el nuevo Predicador tenga una Iglesia asignada.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newPreacher?.theirChurch?.id },
      });

      if (newChurch.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la nueva Iglesia debe ser "Activo".`,
        );
      }

      //! Exchange of preachers and disciples between family groups
      //* Current Values
      const currentFamilyGroupPreacher = familyGroup?.theirPreacher;
      const currentFamilyGroupDisciples = familyGroup?.disciples?.map(
        (disciple) => disciple,
      );

      //* New values
      if (!newPreacher?.theirFamilyGroup) {
        throw new BadRequestException(
          `Ese necesario tener un grupo familiar asignado en el nuevo predicador, para poder intercambiarlos.`,
        );
      }

      const newFamilyGroup = await this.familyGroupRepository.findOne({
        where: { id: newPreacher?.theirFamilyGroup?.id },
        relations: [
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
          'theirPreacher',
          'disciples',
        ],
      });

      if (!newFamilyGroup) {
        throw new BadRequestException(
          `Grupo Familiar con id: ${newPreacher?.theirFamilyGroup?.id} no fue encontrado`,
        );
      }

      if (newFamilyGroup.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en el nuevo Grupo Familiar debe ser "Activo".`,
        );
      }

      const newFamilyGroupPreacher = newPreacher;
      const newFamilyGroupDisciples = newFamilyGroup?.disciples?.map(
        (disciple) => disciple,
      );

      //! Remove relationships from current family group and preacher
      //* Preacher
      try {
        const updateCurrentPreacher = await this.preacherRepository.preload({
          id: familyGroup?.theirPreacher?.id,
          theirFamilyGroup: null,
          updatedAt: new Date(),
          updatedBy: user,
        });

        await this.preacherRepository.save(updateCurrentPreacher);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Family Group
      try {
        const updateCurrentFamilyGroup =
          await this.familyGroupRepository.preload({
            id: familyGroup?.id,
            theirPreacher: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        await this.familyGroupRepository.save(updateCurrentFamilyGroup);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //! Remove relationships from new family group and preacher
      //* Preacher
      try {
        const updateNewPreacher = await this.preacherRepository.preload({
          id: newFamilyGroup?.theirPreacher?.id,
          theirFamilyGroup: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
        await this.preacherRepository.save(updateNewPreacher);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Family Group
      try {
        const updateNewFamilyGroup = await this.familyGroupRepository.preload({
          id: newFamilyGroup?.id,
          theirPreacher: null,
          updatedAt: new Date(),
          updatedBy: user,
        });
        await this.familyGroupRepository.save(updateNewFamilyGroup);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Set the new preacher and family group to the current values
      try {
        const updateCurrentFamilyGroup =
          await this.familyGroupRepository.preload({
            id: familyGroup?.id,
            theirPreacher: newFamilyGroupPreacher,
            updatedAt: new Date(),
            updatedBy: user,
          });

        await this.familyGroupRepository.save(updateCurrentFamilyGroup);

        const updateCurrentPreacher = await this.preacherRepository.preload({
          id: familyGroup?.theirPreacher?.id,
          theirFamilyGroup: newFamilyGroup,
          updatedAt: new Date(),
          updatedBy: user,
        });

        await this.preacherRepository.save(updateCurrentPreacher);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Set the current preacher and family group to the new values
      try {
        const updateNewFamilyGroup = await this.familyGroupRepository.preload({
          id: newFamilyGroup?.id,
          theirPreacher: currentFamilyGroupPreacher,
          updatedAt: new Date(),
          updatedBy: user,
        });

        await this.familyGroupRepository.save(updateNewFamilyGroup);

        const updateNewPreacher = await this.preacherRepository.preload({
          id: newFamilyGroup?.theirPreacher?.id,
          theirFamilyGroup: familyGroup,
          updatedAt: new Date(),
          updatedBy: user,
        });

        await this.preacherRepository.save(updateNewPreacher);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Update relationships and set disciples up for their new family group
      try {
        await Promise.all(
          newFamilyGroupDisciples?.map(async (disciple) => {
            await this.discipleRepository.update(disciple.id, {
              theirFamilyGroup: familyGroup,
              theirPreacher: currentFamilyGroupPreacher,
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
          currentFamilyGroupDisciples?.map(async (disciple) => {
            await this.discipleRepository.update(disciple.id, {
              theirFamilyGroup: newFamilyGroup,
              theirPreacher: newFamilyGroupPreacher,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is same Preacher and Zone
    if (
      !newTheirPreacher &&
      updateFamilyGroupDto.theirPreacher === familyGroup.theirPreacher.id &&
      updateFamilyGroupDto.theirZone === familyGroup.theirZone.id
    ) {
      const updatedFamilyGroup = await this.familyGroupRepository.preload({
        id: familyGroup.id,
        ...updateFamilyGroupDto,
        theirChurch: familyGroup.theirChurch,
        theirPastor: familyGroup.theirPastor,
        theirCopastor: familyGroup.theirCopastor,
        theirSupervisor: familyGroup.theirSupervisor,
        theirZone: familyGroup.theirZone,
        theirPreacher: familyGroup.theirPreacher,
        updatedAt: new Date(),
        updatedBy: user,
        recordStatus: recordStatus,
      });

      try {
        return await this.familyGroupRepository.save(updatedFamilyGroup);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //! DELETE FAMILY GROUP
  async remove(id: string, user: User): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const familyGroup = await this.familyGroupRepository.findOne({
      where: { id: id },
      relations: ['theirZone'],
    });

    if (!familyGroup) {
      throw new NotFoundException(`Family Group with id: ${id} not exits`);
    }

    // TODO : tmb tendria que eliminar la familygroup del predicador para que lo libere. (si se elimina pero problema en actualizar porque esta campo bloqueado, liberar predicador para poder tener uno disponible)
    // TODO : y setearlo en la actualizacion de arriba
    // TODO : en el update form hacer condicional la busqueda y no bloeuqar
    //* Update and set in Inactive on Family House
    const updatedFamilyGroup = await this.familyGroupRepository.preload({
      id: familyGroup.id,
      theirChurch: null,
      theirPastor: null,
      theirCopastor: null,
      theirSupervisor: null,
      theirZone: null,
      theirPreacher: null,
      familyGroupCode: null,
      familyGroupNumber: null,
      updatedAt: new Date(),
      updatedBy: user,
      recordStatus: RecordStatus.Inactive,
    });

    try {
      await this.familyGroupRepository.save(updatedFamilyGroup);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirFamilyGroup'],
    });

    try {
      //* Update and set to null relationships in Disciple
      const disciplesByFamilyGroup = allDisciples.filter(
        (disciple) => disciple.theirFamilyGroup?.id === familyGroup?.id,
      );

      await Promise.all(
        disciplesByFamilyGroup.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirFamilyGroup: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //* Reorder family group numbers and codes in the zone
    const familyGroupsByOrder = await this.familyGroupRepository.find({
      relations: ['theirZone'],
      where: { recordStatus: RecordStatus.Active },
      order: { familyGroupNumber: 'ASC' },
    });

    const familyGroupsByOrderFiltered = familyGroupsByOrder.filter(
      (group) => group.theirZone?.id === familyGroup.theirZone?.id,
    );

    await Promise.all(
      familyGroupsByOrderFiltered.map(async (familyGroup, index) => {
        await this.familyGroupRepository.update(familyGroup.id, {
          familyGroupNumber: index + 1,
          familyGroupCode: `${familyGroup.theirZone?.zoneName?.toUpperCase()}-${index + 1}`,
          updatedAt: new Date(),
          updatedBy: user,
        });
      }),
    );
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
