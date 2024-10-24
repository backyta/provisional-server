import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, ILike, In, Repository } from 'typeorm';

import { DashboardSearchType, RecordStatus } from '@/common/enums';
import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
} from '@/modules/family-group/dto';
import {
  FamilyGroupSearchType,
  FamilyGroupSearchSubType,
  FamilyGroupSearchTypeNames,
} from '@/modules/family-group/enums';
import { FamilyGroup } from '@/modules/family-group/entities';
import { familyGroupDataFormatter } from '@/modules/family-group/helpers';

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

  //* CREATE FAMILY GROUP
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

    if (preacher?.recordStatus === RecordStatus.Inactive) {
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

    if (supervisor?.recordStatus === RecordStatus.Inactive) {
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

    if (zone?.recordStatus === RecordStatus.Inactive) {
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

    if (copastor?.recordStatus === RecordStatus.Inactive) {
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

    if (pastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Pastor debe ser "Activo".`,
      );
    }

    // Church
    if (!preacher?.theirChurch) {
      throw new NotFoundException(
        `Iglesia no fue encontrada, verifica que Predicador tenga una Iglesia asignada.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: preacher?.theirChurch?.id },
    });

    if (church?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Iglesia debe ser "Activo".`,
      );
    }

    //? Assignment of number and code to the family group
    const allFamilyGroups = await this.familyGroupRepository.find({
      relations: ['theirZone'],
    });
    const allFamilyGroupsByZone = allFamilyGroups.filter(
      (familyGroup) => familyGroup?.theirZone?.id === zone?.id,
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

        const familyGroups = await this.familyGroupRepository.find({
          where: { theirChurch: church, recordStatus: RecordStatus.Active },

          order: { createdAt: order as FindOptionsOrderValue },
        });

        return familyGroups;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    try {
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
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return familyGroupDataFormatter({ familyGroups }) as any;
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
  ): Promise<FamilyGroup | FamilyGroup[]> {
    const {
      'search-type': searchType,
      'search-sub-type': searchSubType,
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

    //? Find by first name --> Many
    //* FamilyGroups by preacher names
    if (
      term &&
      searchType === FamilyGroupSearchType.FirstName &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPreacherNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const preachers = await this.preacherRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const preachersId = preachers.map((preacher) => preacher?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los nombres de su predicador: ${firstNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by supervisor names
    if (
      term &&
      searchType === FamilyGroupSearchType.FirstName &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupBySupervisorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const supervisorsId = supervisors.map((supervisor) => supervisor?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los nombres de su supervisor: ${firstNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by co-pastor names
    if (
      term &&
      searchType === FamilyGroupSearchType.FirstName &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByCopastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastorsId = copastors.map((copastor) => copastor?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los nombres de su co-pastor: ${firstNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by pastor names
    if (
      term &&
      searchType === FamilyGroupSearchType.FirstName &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const pastorsId = pastors.map((pastor) => pastor?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los nombres de su pastor: ${firstNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by last name --> Many
    //* Family Groups by preacher last names
    if (
      term &&
      searchType === FamilyGroupSearchType.LastName &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPreacherLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const preachers = await this.preacherRepository.find({
          where: {
            lastName: ILike(`%${lastNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const preacherId = preachers.map((preacher) => preacher?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los apellidos de su predicador: ${lastNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by supervisor last names
    if (
      term &&
      searchType === FamilyGroupSearchType.LastName &&
      searchSubType ===
        FamilyGroupSearchSubType.FamilyGroupBySupervisorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            lastName: ILike(`%${lastNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const supervisorsId = supervisors.map((supervisor) => supervisor?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los apellidos de su supervisor: ${lastNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Grupos familiares by co-pastor last names
    if (
      term &&
      searchType === FamilyGroupSearchType.LastName &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByCopastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            lastName: ILike(`%${lastNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastorsId = copastors.map((copastor) => copastor?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los apellidos de su co-pastor: ${lastNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by pastor last names
    if (
      term &&
      searchType === FamilyGroupSearchType.LastName &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            lastName: ILike(`%${lastNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const pastorsId = pastors.map((pastor) => pastor?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los apellidos de su pastor: ${lastNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by full name --> Many
    //* Family groups by preacher full names
    if (
      term &&
      searchType === FamilyGroupSearchType.FullName &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPreacherFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const preachers = await this.preacherRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            lastName: ILike(`%${lastNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const preachersId = preachers.map((preacher) => preacher?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los nombres y apellidos de su predicador: ${firstNames} ${lastNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by supervisor full names
    if (
      term &&
      searchType === FamilyGroupSearchType.FullName &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupBySupervisorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            lastName: ILike(`%${lastNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const supervisorsId = supervisors.map((supervisor) => supervisor?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los nombres y apellidos de su supervisor: ${firstNames} ${lastNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by co-pastor full names
    if (
      term &&
      searchType === FamilyGroupSearchType.FullName &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByCopastorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            lastName: ILike(`%${lastNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastorsId = copastors.map((copastor) => copastor?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los nombres y apellidos de su co-pastor: ${firstNames} ${lastNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by pastor full names
    if (
      term &&
      searchType === FamilyGroupSearchType.FullName &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPastorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            lastName: ILike(`%${lastNames}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const pastorsId = pastors.map((pastor) => pastor?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares por los nombres y apellidos de su pastor: ${firstNames} ${lastNames}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by family-group-code --> Many
    if (term && searchType === FamilyGroupSearchType.FamilyGroupCode) {
      try {
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

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by family-group-name --> Many
    if (term && searchType === FamilyGroupSearchType.FamilyGroupName) {
      try {
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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este nombre: ${term}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by zone name --> Many
    if (term && searchType === FamilyGroupSearchType.ZoneName) {
      try {
        const zones = await this.zoneRepository.find({
          where: {
            zoneName: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const zonesId = zones.map((zone) => zone?.id);

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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este nombre zona: ${term}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by department --> Many
    if (term && searchType === FamilyGroupSearchType.Department) {
      try {
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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este departamento: ${term}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by province --> Many
    if (term && searchType === FamilyGroupSearchType.Province) {
      try {
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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con esta provincia: ${term}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by district --> Many
    if (term && searchType === FamilyGroupSearchType.District) {
      try {
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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este distrito: ${term}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === FamilyGroupSearchType.UrbanSector) {
      try {
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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este sector urbano: ${term}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by address --> Many
    if (term && searchType === FamilyGroupSearchType.Address) {
      try {
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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con esta dirección: ${term}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by status --> Many
    if (term && searchType === FamilyGroupSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      try {
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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron grupos familiares con este estado de registro: ${value}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find family groups by most populated --> Many
    if (term && searchType === DashboardSearchType.MostPopulatedFamilyGroups) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
          where: {
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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(`No se encontraron grupos familiares`);
        }

        const resultData = familyGroups
          .sort((a, b) => b.disciples.length - a.disciples.length)
          .slice(0, 7);

        return familyGroupDataFormatter({
          familyGroups: resultData,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by less populated --> Many
    if (term && searchType === DashboardSearchType.LessPopulatedFamilyGroups) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
          where: {
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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(`No se encontraron grupos familiares`);
        }

        const resultData = familyGroups
          .sort((a, b) => a.disciples.length - b.disciples.length)
          .slice(0, 7);

        return familyGroupDataFormatter({
          familyGroups: resultData,
        }) as any;
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
      !Object.values(FamilyGroupSearchType).includes(
        searchType as FamilyGroupSearchType,
      )
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(FamilyGroupSearchTypeNames).join(', ')}`,
      );
    }

    if (
      term &&
      (FamilyGroupSearchType.FirstName ||
        FamilyGroupSearchType.LastName ||
        FamilyGroupSearchType.FullName) &&
      !searchSubType
    ) {
      throw new BadRequestException(
        `Para buscar por nombres o apellidos el sub-tipo es requerido.`,
      );
    }
  }

  //* UPDATE FAMILY GROUP
  async update(
    id: string,
    updateFamilyGroupDto: UpdateFamilyGroupDto,
    user: User,
  ): Promise<FamilyGroup> {
    const { recordStatus, theirPreacher, newTheirPreacher } =
      updateFamilyGroupDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

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
        `Grupo Familiar con id: ${id} no fue encontrado.`,
      );
    }

    if (
      familyGroup?.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }

    //? Update if new preacher exits and is different but zone is same (exchange preachers)
    if (newTheirPreacher) {
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

      if (!newPreacher?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en Predicador debe ser "Activo".`,
        );
      }

      if (
        familyGroup?.theirPreacher?.id !== newPreacher?.id &&
        familyGroup?.theirZone?.id === newPreacher?.theirZone?.id
      ) {
        //? Validation relation exists in current Family group
        // Preacher
        if (!familyGroup?.theirPreacher) {
          throw new BadRequestException(
            `Predicador no fue encontrado, verifica que el Grupo Familiar actual tenga un Predicador asignado.`,
          );
        }

        if (
          familyGroup?.theirPreacher?.recordStatus === RecordStatus.Inactive
        ) {
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

        if (
          familyGroup?.theirSupervisor?.recordStatus === RecordStatus.Inactive
        ) {
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

        if (
          familyGroup?.theirCopastor?.recordStatus === RecordStatus.Inactive
        ) {
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

        //! Validation same relations between new and current family group
        if (familyGroup?.theirZone?.id !== newPreacher.theirZone?.id) {
          throw new BadRequestException(
            `Para actualizar de Predicador este Grupo Familiar, la zona del nuevo Predicador debe ser la misma que la del Grupo Familiar.`,
          );
        }

        if (
          familyGroup?.theirSupervisor?.id !== newPreacher.theirSupervisor?.id
        ) {
          throw new BadRequestException(
            `Para actualizar de Predicador este Grupo Familiar, el supervisor del nuevo Predicador debe ser el mismo que la del Grupo Familiar.`,
          );
        }

        if (familyGroup?.theirCopastor?.id !== newPreacher.theirCopastor?.id) {
          throw new BadRequestException(
            `Para actualizar de Predicador este Grupo Familiar, el co-pastor del nuevo Predicador debe ser el mismo que la del Grupo Familiar.`,
          );
        }

        if (familyGroup?.theirPastor?.id !== newPreacher.theirPastor?.id) {
          throw new BadRequestException(
            `Para actualizar de Predicador este Grupo Familiar, el pastor del nuevo Predicador debe ser el mismo que la del Grupo Familiar.`,
          );
        }

        if (familyGroup?.theirChurch?.id !== newPreacher.theirChurch?.id) {
          throw new BadRequestException(
            `Para actualizar de Predicador este Grupo Familiar, la iglesia del nuevo Predicador debe ser la misma que la del Grupo Familiar.`,
          );
        }

        //? Validation relation exists in new Preacher
        // Supervisor
        if (!newPreacher?.theirSupervisor) {
          throw new NotFoundException(
            `Supervisor no fue encontrado, verifica que el nuevo Predicador tenga un Supervisor asignado.`,
          );
        }

        const newSupervisor = await this.supervisorRepository.findOne({
          where: { id: newPreacher?.theirSupervisor?.id },
        });

        if (newSupervisor?.recordStatus === RecordStatus.Inactive) {
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

        if (newZone?.recordStatus === RecordStatus.Inactive) {
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

        if (newCopastor?.recordStatus === RecordStatus.Inactive) {
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

        if (newPastor?.recordStatus === RecordStatus.Inactive) {
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

        if (newChurch?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en la nueva Iglesia debe ser "Activo".`,
          );
        }

        //! Exchange of preachers between family groups
        //* Current Values
        const currentFamilyGroupPreacher = familyGroup?.theirPreacher;
        const currentFamilyGroupDisciples = familyGroup?.disciples?.map(
          (disciple) => disciple,
        );

        //* New values
        if (!newPreacher?.theirFamilyGroup) {
          throw new BadRequestException(
            `Es necesario tener un grupo familiar asignado en el nuevo predicador, para poder intercambiarlos.`,
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

        if (newFamilyGroup?.recordStatus === RecordStatus.Inactive) {
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
          const updateNewFamilyGroup = await this.familyGroupRepository.preload(
            {
              id: newFamilyGroup?.id,
              theirPreacher: null,
              updatedAt: new Date(),
              updatedBy: user,
            },
          );
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
          const updateNewFamilyGroup = await this.familyGroupRepository.preload(
            {
              id: newFamilyGroup?.id,
              theirPreacher: currentFamilyGroupPreacher,
              updatedAt: new Date(),
              updatedBy: user,
            },
          );

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
              await this.discipleRepository.update(disciple?.id, {
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
              await this.discipleRepository.update(disciple?.id, {
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
    }

    //? Update and save if is same Preacher and Zone
    if (
      !newTheirPreacher &&
      updateFamilyGroupDto?.theirPreacher === familyGroup.theirPreacher?.id &&
      updateFamilyGroupDto?.theirZone === familyGroup.theirZone?.id
    ) {
      const updatedFamilyGroup = await this.familyGroupRepository.preload({
        id: familyGroup?.id,
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

    //? Update and save if is different Preacher (not newPreacher) and same Zone (inactive to active record and when delete preacher), disciple without family group.
    if (
      !newTheirPreacher &&
      updateFamilyGroupDto?.theirPreacher !== familyGroup.theirPreacher?.id &&
      updateFamilyGroupDto?.theirZone === familyGroup.theirZone?.id
    ) {
      //* Validation preacher
      const newPreacher = await this.preacherRepository.findOne({
        where: { id: theirPreacher },
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

      if (!newPreacher?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en Predicador debe ser "Activo".`,
        );
      }

      //! Validation same relations
      if (newPreacher?.theirZone?.id !== familyGroup?.theirZone?.id) {
        throw new BadRequestException(
          `Para actualizar de Predicador este Grupo Familiar, la zona del nuevo Predicador debe ser la misma que la del Grupo Familiar.`,
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

      if (newSupervisor?.recordStatus === RecordStatus.Inactive) {
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

      if (newZone?.recordStatus === RecordStatus.Inactive) {
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

      if (newCopastor?.recordStatus === RecordStatus.Inactive) {
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

      if (newPastor?.recordStatus === RecordStatus.Inactive) {
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

      if (newChurch?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la nueva Iglesia debe ser "Activo".`,
        );
      }

      try {
        const updatedFamilyGroup = await this.familyGroupRepository.preload({
          id: familyGroup?.id,
          ...updateFamilyGroupDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
          theirZone: newZone,
          theirPreacher: newPreacher,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        //* Set relationship in preacher according their family group
        newPreacher.theirFamilyGroup = updatedFamilyGroup;
        await this.preacherRepository.save(newPreacher);

        return await this.familyGroupRepository.save(updatedFamilyGroup);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //! DELETE FAMILY GROUP
  async remove(id: string, user: User): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const familyGroup = await this.familyGroupRepository.findOne({
      where: { id: id },
    });

    if (!familyGroup) {
      throw new NotFoundException(
        `Grupo Familiar con id: ${id} no fue encontrado.`,
      );
    }

    //* Update and set in Inactive on Family Group
    try {
      const updatedFamilyGroup = await this.familyGroupRepository.preload({
        id: familyGroup.id,
        theirChurch: null,
        theirPastor: null,
        theirCopastor: null,
        theirSupervisor: null,
        theirPreacher: null,
        updatedAt: new Date(),
        updatedBy: user,
        recordStatus: RecordStatus.Inactive,
      });

      await this.familyGroupRepository.save(updatedFamilyGroup);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in preacher their family group
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirFamilyGroup'],
    });

    try {
      const preachersFamilyGroup = allPreachers.filter(
        (preacher) => preacher.theirFamilyGroup?.id === familyGroup?.id,
      );

      await Promise.all(
        preachersFamilyGroup.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirFamilyGroup: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
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
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      const detail = error.detail;

      if (detail.includes('group')) {
        throw new BadRequestException(
          'El nombre de grupo familiar ya está existe.',
        );
      }
    }

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador y que revise los registros de consola.',
    );
  }
}
