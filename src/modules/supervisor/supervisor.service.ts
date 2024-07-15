import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Between, FindOptionsOrderValue, ILike, In, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';

import {
  CreateSupervisorDto,
  UpdateSupervisorDto,
} from '@/modules/supervisor/dto';
import { formatDataSupervisor } from '@/modules/supervisor/helpers';

import { formatToDDMMYYYY, getBirthdaysByMonth } from '@/common/helpers';
import { PaginationDto, SearchTypeAndPaginationDto } from '@/common/dtos';
import { MemberRoles, SearchSubType, SearchType, Status } from '@/common/enums';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';

@Injectable()
export class SupervisorService {
  private readonly logger = new Logger('CopastorService');

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

  //* CREATE SUPERVISOR
  async create(
    createSupervisorDto: CreateSupervisorDto,
    user: User,
  ): Promise<Supervisor> {
    const {
      roles,
      theirCopastor,
      theirPastor,
      isDirectRelationToPastor,
      numberChildren,
    } = createSupervisorDto;

    // Validations
    if (
      !roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Supervisor)
    ) {
      throw new BadRequestException(
        `El rol "Discípulo" y "Supervisor" deben ser incluidos.`,
      );
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Preacher)
    ) {
      throw new BadRequestException(
        `Para crear un Supervisor, solo se requiere los roles: "Discípulo" y "Supervisor" o también "Tesorero."`,
      );
    }

    //? Validate and assign copastor

    //* If is direct relation to pastor is false (create with copastor)
    if (!isDirectRelationToPastor) {
      if (!theirCopastor) {
        throw new NotFoundException(
          `Para crear un nuevo Supervisor se debe asigna un Co-Pastor.`,
        );
      }

      const copastor = await this.copastorRepository.findOne({
        where: { id: theirCopastor },
        relations: ['theirPastor', 'theirChurch'],
      });

      if (!copastor) {
        throw new NotFoundException(
          `No se encontró Co-Pastor con el id: ${theirCopastor}`,
        );
      }

      if (copastor.status === Status.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado" en Co-Pastor debe ser "Activo".`,
        );
      }

      //* Validate and assign pastor according copastor
      if (!copastor?.theirPastor) {
        throw new NotFoundException(
          `Pastor no fue encontrado, verifica que Co-Pastor tenga un Pastor asignado.`,
        );
      }

      const pastor = await this.pastorRepository.findOne({
        where: { id: copastor?.theirPastor?.id },
      });

      if (pastor.status === Status.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado" en Pastor debe ser "Activo".`,
        );
      }

      //* Validate and assign church according copastor
      if (!copastor?.theirChurch) {
        throw new NotFoundException(
          `No se encontró la Iglesia, verifica que Co-Pastor tenga una Iglesia asignada`,
        );
      }

      const church = await this.churchRepository.findOne({
        where: { id: copastor?.theirChurch?.id },
      });

      if (church.status === Status.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado" en la Iglesia debe ser "Activo"`,
        );
      }

      // Create new instance
      try {
        const newSupervisor = this.supervisorRepository.create({
          ...createSupervisorDto,
          numberChildren: +numberChildren,
          theirChurch: church,
          theirPastor: pastor,
          theirCopastor: copastor,
          createdAt: new Date(),
          createdBy: user,
        });

        return await this.supervisorRepository.save(newSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* If is direct relation to pastor is true (omit copastor)

    if (isDirectRelationToPastor) {
      //* Validate and assign pastor
      if (!theirPastor) {
        throw new NotFoundException(
          `Para crear un nuevo supervisor de forma directa, debe asignar un Pastor.`,
        );
      }

      const pastor = await this.pastorRepository.findOne({
        where: { id: theirPastor },
        relations: ['theirChurch'],
      });

      if (!pastor) {
        throw new NotFoundException(
          `No se encontró Pastor con id: ${theirCopastor}`,
        );
      }

      if (pastor.status === Status.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado" en Co-Pastor debe ser "Activo"`,
        );
      }

      //* Validate and assign pastor according copastor
      if (!pastor?.theirChurch) {
        throw new NotFoundException(
          `No se encontró la Iglesia, verifica que el Pastor tenga una Iglesia asignada.`,
        );
      }

      const church = await this.churchRepository.findOne({
        where: { id: pastor?.theirChurch?.id },
      });

      if (pastor.status === Status.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado" en Pastor debe ser "Activo".`,
        );
      }

      // Create new instance
      try {
        const newSupervisor = this.supervisorRepository.create({
          ...createSupervisorDto,
          numberChildren: +numberChildren,
          theirChurch: church,
          theirPastor: pastor,
          theirCopastor: null,
          createdAt: new Date(),
          createdBy: user,
        });

        return await this.supervisorRepository.save(newSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit = 10, offset = 0, order = 'ASC' } = paginationDto;

    const supervisors = await this.supervisorRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'updatedBy',
        'createdBy',
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirZone',
        'preachers',
        'familyGroups',
        'disciples',
      ],
      relationLoadStrategy: 'query',
      order: { createdAt: order as FindOptionsOrderValue },
    });

    return formatDataSupervisor({ supervisors }) as any;
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchTypeAndPaginationDto,
  ): Promise<Supervisor | Supervisor[]> {
    const {
      'search-type': searchType,
      'search-sub-type': searchSubType,
      limit = 10,
      offset = 0,
      order,
    } = searchTypeAndPaginationDto;

    //? Find by first name () --> Many
    //* Supervisors by supervisor names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.BySupervisorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) con estos nombres: ${firstNames}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Supervisors by co-pastor names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.SupervisorByCopastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const copastors = await this.copastorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const copastorsId = copastors.map((copastor) => copastor.id);

      const supervisors = await this.supervisorRepository.find({
        where: {
          theirCopastor: In(copastorsId),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) por los nombres de su co-pastor: ${firstNames}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Supervisors by pastor names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.SupervisorByPastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const pastors = await this.pastorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const pastorsId = pastors.map((pastor) => pastor.id);

      const supervisors = await this.supervisorRepository.find({
        where: {
          theirPastor: In(pastorsId),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) por los nombres de su pastor: ${firstNames}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by last name --> Many
    //* Supervisors by last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.BySupervisorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) con estos apellidos: ${lastNames}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Supervisors by co-pastor last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.SupervisorByCopastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const copastors = await this.copastorRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const copastorsId = copastors.map((copastor) => copastor.id);

      const supervisors = await this.supervisorRepository.find({
        where: {
          theirCopastor: In(copastorsId),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) por los apellidos de su co-pastor: ${lastNames}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Supervisors by pastor last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.SupervisorByPastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const pastors = await this.pastorRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const pastorsId = pastors.map((pastor) => pastor.id);

      const supervisors = await this.supervisorRepository.find({
        where: {
          theirPastor: In(pastorsId),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) por los apellidos de su pastor: ${lastNames}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by full name --> Many
    //* Supervisors by full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.BySupervisorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          lastName: ILike(`%${lastNames}%`),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) con estos nombres y apellidos: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Supervisors by co-pastor full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.SupervisorByCopastorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const copastors = await this.copastorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          lastName: ILike(`%${lastNames}%`),
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const copastorsId = copastors.map((copastor) => copastor.id);

      const supervisors = await this.supervisorRepository.find({
        where: {
          theirCopastor: In(copastorsId),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) por los nombres y apellidos de su co-pastor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Supervisors by pastor full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.SupervisorByPastorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const pastors = await this.pastorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          lastName: ILike(`%${lastNames}%`),
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const pastorsId = pastors.map((pastor) => pastor.id);

      const supervisors = await this.supervisorRepository.find({
        where: {
          theirPastor: In(pastorsId),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) por los nombres y apellidos de su pastor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by birth date --> Many
    if (term && searchType === SearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      const supervisors = await this.supervisorRepository.find({
        where: {
          birthDate: Between(fromDate, toDate),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        const fromDate = formatToDDMMYYYY(fromTimestamp);
        const toDate = formatToDDMMYYYY(toTimestamp);

        throw new NotFoundException(
          `No se encontraron supervisores(as) con este rango de fechas de nacimiento: ${fromDate} - ${toDate}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === SearchType.BirthMonth) {
      const supervisors = await this.supervisorRepository.find({
        where: {
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const resultSupervisors = getBirthdaysByMonth({
        month: term,
        data: supervisors,
      });

      if (resultSupervisors.length === 0) {
        const monthNames = {
          january: 'Enero',
          february: 'Febrero',
          march: 'Marzo',
          april: 'Abril',
          may: 'Mayo',
          june: 'Junio',
          july: 'Julio',
          august: 'Agosto',
          september: 'Septiembre',
          october: 'Octubre',
          november: 'Noviembre',
          december: 'Diciembre',
        };

        const monthInSpanish = monthNames[term.toLowerCase()] ?? term;

        throw new NotFoundException(
          `No se encontraron supervisores(as) con este mes de nacimiento: ${monthInSpanish}`,
        );
      }

      try {
        return formatDataSupervisor({
          supervisors: resultSupervisors as Supervisor[],
        }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by zone --> Many
    if (term && searchType === SearchType.Zone) {
      const zones = await this.zoneRepository.find({
        where: {
          zoneName: ILike(`%${term}%`),
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const zonesId = zones.map((zone) => zone.id);

      const supervisors = await this.supervisorRepository.find({
        where: {
          theirZone: In(zonesId),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) con este genero: ${term}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by gender --> Many
    if (term && searchType === SearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      const supervisors = await this.supervisorRepository.find({
        where: {
          gender: genderTerm,
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        const genderNames = {
          male: 'Masculino',
          female: 'Femenino',
        };

        const genderInSpanish = genderNames[term.toLowerCase()] ?? term;

        throw new NotFoundException(
          `No se encontraron supervisores(as) con este genero: ${genderInSpanish}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by marital status --> Many
    if (term && searchType === SearchType.MaritalStatus) {
      const maritalStatusTerm = term.toLowerCase();
      const validMaritalStatus = [
        'singles',
        'married',
        'widowed',
        'divorced',
        'other',
      ];

      if (!validMaritalStatus.includes(maritalStatusTerm)) {
        throw new BadRequestException(`Estado Civil no válido: ${term}`);
      }

      const supervisors = await this.supervisorRepository.find({
        where: {
          maritalStatus: maritalStatusTerm,
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        const maritalStatusNames = {
          single: 'Soltero(a)',
          married: 'Casado(a)',
          widowed: 'Viudo(a)',
          divorced: 'Divorciado(a)',
          other: 'Otro',
        };

        const maritalStatusInSpanish =
          maritalStatusNames[term.toLowerCase()] ?? term;

        throw new NotFoundException(
          `No se encontraron supervisores(as) con este estado civil: ${maritalStatusInSpanish}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === SearchType.OriginCountry) {
      const supervisors = await this.supervisorRepository.find({
        where: {
          originCountry: ILike(`%${term}%`),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) con este país de origen: ${term}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by department --> Many
    if (term && searchType === SearchType.Department) {
      const supervisors = await this.supervisorRepository.find({
        where: {
          department: ILike(`%${term}%`),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) con este departamento: ${term}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by province --> Many
    if (term && searchType === SearchType.Province) {
      const supervisors = await this.supervisorRepository.find({
        where: {
          province: ILike(`%${term}%`),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervises(as) con esta provincia: ${term}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by district --> Many
    if (term && searchType === SearchType.District) {
      const supervisors = await this.supervisorRepository.find({
        where: {
          district: ILike(`%${term}%`),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) con este distrito: ${term}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === SearchType.UrbanSector) {
      const supervisors = await this.supervisorRepository.find({
        where: {
          urbanSector: ILike(`%${term}%`),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) con este sector urbano: ${term}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by address --> Many
    if (term && searchType === SearchType.Address) {
      const supervisors = await this.supervisorRepository.find({
        where: {
          address: ILike(`%${term}%`),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron supervisores(as) con esta dirección: ${term}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by status --> Many
    if (term && searchType === SearchType.Status) {
      const statusTerm = term.toLowerCase();
      const validStatus = ['active', 'inactive'];

      if (!validStatus.includes(statusTerm)) {
        throw new BadRequestException(`Estado no válido: ${term}`);
      }

      const supervisors = await this.supervisorRepository.find({
        where: {
          status: statusTerm,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirZone',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        const value = term === 'inactive' ? 'Inactivo' : 'Activo';

        throw new NotFoundException(
          `No se encontraron supervisores(as) con este estado: ${value}`,
        );
      }

      try {
        return formatDataSupervisor({ supervisors }) as any;
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

  //* UPDATE SUPERVISOR
  async update(
    id: string,
    updateSupervisorDto: UpdateSupervisorDto,
    user: User,
  ): Promise<Supervisor | Copastor> {
    const {
      roles,
      status,
      theirPastor,
      theirCopastor,
      isDirectRelationToPastor,
      numberChildren,
    } = updateSupervisorDto;

    // Validations
    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar el Supervisor.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    // validation supervisor
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: id },
      relations: ['theirCopastor', 'theirPastor', 'theirChurch'],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Supervisor con id: ${id} no fue encontrado.`,
      );
    }

    if (!roles.some((role) => ['disciple', 'supervisor'].includes(role))) {
      throw new BadRequestException(
        `Los roles deben incluir "Discípulo" y "Supervisor".`,
      );
    }

    //todo : corregir esto. ver casos de uso en el front
    // NOTE : revisar esto porque si se podría
    // if (
    //   roles.includes(MemberRoles.Supervisor) &&
    //   supervisor.isDirectRelationToPastor &&
    //   theirCopastor
    // ) {
    //   throw new BadRequestException(
    //     `No se puede asignar un co-pastor mientras "relación directa" con Pastor esta activo.`,
    //   );
    // }

    // if (
    //   roles.includes(MemberRoles.Supervisor) &&
    //   isDirectRelationToPastor &&
    //   theirCopastor
    // ) {
    //   throw new BadRequestException(
    //     `No se puede asignar un co-pastor mientras "relación directa" con Pastor esta activo.`,
    //   );
    // }

    // if (
    //   roles.includes(MemberRoles.Supervisor) &&
    //   !supervisor.isDirectRelationToPastor &&
    //   theirPastor
    // ) {
    //   throw new BadRequestException(
    //     `No se puede asignar un pastor mientras "relación directa" con Pastor esta inactivo.2`,
    //   );
    // }

    // if (
    //   roles.includes(MemberRoles.Supervisor) &&
    //   !isDirectRelationToPastor &&
    //   theirPastor
    // ) {
    //   throw new BadRequestException(
    //     `No se puede asignar un pastor mientras "relación directa" con Pastor esta inactivo.`,
    //   );
    // }

    if (
      (supervisor.roles.includes(MemberRoles.Supervisor) &&
        supervisor.roles.includes(MemberRoles.Disciple) &&
        !supervisor.roles.includes(MemberRoles.Preacher) &&
        !supervisor.roles.includes(MemberRoles.Copastor) &&
        !supervisor.roles.includes(MemberRoles.Pastor) &&
        !supervisor.roles.includes(MemberRoles.Treasurer) &&
        (roles.includes(MemberRoles.Pastor) ||
          roles.includes(MemberRoles.Preacher))) ||
      (supervisor.roles.includes(MemberRoles.Supervisor) &&
        supervisor.roles.includes(MemberRoles.Disciple) &&
        supervisor.roles.includes(MemberRoles.Treasurer) &&
        !supervisor.roles.includes(MemberRoles.Preacher) &&
        !supervisor.roles.includes(MemberRoles.Copastor) &&
        !supervisor.roles.includes(MemberRoles.Pastor) &&
        (roles.includes(MemberRoles.Pastor) ||
          roles.includes(MemberRoles.Preacher)))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol inferior o superior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor].`,
      );
    }

    //* Update info about Supervisor
    if (
      (supervisor.roles.includes(MemberRoles.Disciple) &&
        supervisor.roles.includes(MemberRoles.Supervisor) &&
        !supervisor.roles.includes(MemberRoles.Pastor) &&
        !supervisor.roles.includes(MemberRoles.Copastor) &&
        !supervisor.roles.includes(MemberRoles.Preacher) &&
        !supervisor.roles.includes(MemberRoles.Treasurer) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Supervisor) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Preacher) &&
        !roles.includes(MemberRoles.Treasurer)) ||
      (supervisor.roles.includes(MemberRoles.Disciple) &&
        supervisor.roles.includes(MemberRoles.Supervisor) &&
        supervisor.roles.includes(MemberRoles.Treasurer) &&
        !supervisor.roles.includes(MemberRoles.Copastor) &&
        !supervisor.roles.includes(MemberRoles.Preacher) &&
        !supervisor.roles.includes(MemberRoles.Pastor) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Supervisor) &&
        roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Preacher)) ||
      (supervisor.roles.includes(MemberRoles.Disciple) &&
        supervisor.roles.includes(MemberRoles.Supervisor) &&
        !supervisor.roles.includes(MemberRoles.Pastor) &&
        !supervisor.roles.includes(MemberRoles.Copastor) &&
        !supervisor.roles.includes(MemberRoles.Preacher) &&
        !supervisor.roles.includes(MemberRoles.Treasurer) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Supervisor) &&
        roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Preacher)) ||
      (supervisor.roles.includes(MemberRoles.Disciple) &&
        supervisor.roles.includes(MemberRoles.Supervisor) &&
        supervisor.roles.includes(MemberRoles.Treasurer) &&
        !supervisor.roles.includes(MemberRoles.Pastor) &&
        !supervisor.roles.includes(MemberRoles.Copastor) &&
        !supervisor.roles.includes(MemberRoles.Preacher) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Supervisor) &&
        !roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Preacher))
    ) {
      // Validations
      if (supervisor.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //? Update if their Copastor is different and id direct relation to pastor is false (means require copastor)
      if (
        supervisor.theirCopastor?.id !== theirCopastor &&
        !isDirectRelationToPastor
      ) {
        //* Validate copastor
        if (!theirCopastor) {
          throw new NotFoundException(
            `Para poder actualizar un Supervisor, se debe asignar un Co-Pastor.`,
          );
        }

        const newCopastor = await this.copastorRepository.findOne({
          where: { id: theirCopastor },
          relations: ['theirPastor', 'theirChurch'],
        });

        if (!newCopastor) {
          throw new NotFoundException(
            `Co-Pastor con id: ${theirCopastor} no fue encontrado.`,
          );
        }

        if (newCopastor.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado" en Co-Pastor debe ser "Activo".`,
          );
        }

        //* Validate Pastor according copastor
        if (!newCopastor?.theirPastor) {
          throw new BadRequestException(
            `No se encontró el Pastor, verifica que Co-Pastor tenga un Pastor asignado.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newCopastor?.theirPastor?.id },
        });

        if (newPastor.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado" en Pastor debe ser "Activo".`,
          );
        }

        //* Validate Church according copastor
        if (!newCopastor?.theirChurch) {
          throw new BadRequestException(
            `No se encontró la Iglesia, verifica que Co-Pastor tenga una Iglesia asignado.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newCopastor?.theirChurch?.id },
        });

        if (newChurch.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado" en Iglesia debe ser "Activo".`,
          );
        }

        // Update and save
        const updatedSupervisor = await this.supervisorRepository.preload({
          id: supervisor.id,
          ...updateSupervisorDto,
          numberChildren: +numberChildren,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        let savedSupervisor: Supervisor;

        try {
          savedSupervisor =
            await this.supervisorRepository.save(updatedSupervisor);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //? Update in subordinate relations
        const allZones = await this.zoneRepository.find({
          relations: ['theirSupervisor'],
        });

        const allPreachers = await this.preacherRepository.find({
          relations: ['theirSupervisor'],
        });

        const allFamilyGroups = await this.familyGroupRepository.find({
          relations: ['theirSupervisor'],
        });

        const allDisciples = await this.discipleRepository.find({
          relations: ['theirSupervisor'],
        });

        try {
          //* Update and set new relationships in Zone
          const zonesBySupervisor = allZones.filter(
            (zone) => zone.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            zonesBySupervisor.map(async (zone) => {
              await this.zoneRepository.update(zone.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
              });
            }),
          );

          //* Update and set new relationships in Preacher
          const preachersBySupervisor = allPreachers.filter(
            (preacher) => preacher.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            preachersBySupervisor.map(async (preacher) => {
              await this.preacherRepository.update(preacher.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
              });
            }),
          );

          //* Update and set new relationships in Family House
          const familyGroupsBySupervisor = allFamilyGroups.filter(
            (familyGroup) => familyGroup.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            familyGroupsBySupervisor.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
              });
            }),
          );

          //* Update and set new relationships in Disciple
          const disciplesBySupervisor = allDisciples.filter(
            (disciple) => disciple.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            disciplesBySupervisor.map(async (disciple) => {
              await this.discipleRepository.update(disciple.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }
        return savedSupervisor;
      }

      //! Update if Is Direction relation to pastor is true
      if (isDirectRelationToPastor) {
        //* Validate pastor
        if (!theirPastor) {
          throw new NotFoundException(
            `Para vincular directamente un Supervisor con un Pastor, debe asignar un Pastor.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: theirPastor },
          relations: ['theirChurch'],
        });

        if (!newPastor) {
          throw new NotFoundException(
            `Pastor con id: ${theirPastor} no fue encontrado.`,
          );
        }

        if (newPastor.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado" en Pastor debe ser "Activo".`,
          );
        }

        //* Validate Church according pastor
        if (!newPastor?.theirChurch) {
          throw new BadRequestException(
            `No se encontró la Iglesia, verifica que Pastor tenga una Iglesia asignado.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newPastor?.theirChurch?.id },
        });

        if (newChurch.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado" en Iglesia debe ser "Activo".`,
          );
        }

        // Update and save
        const updatedSupervisor = await this.supervisorRepository.preload({
          id: supervisor.id,
          ...updateSupervisorDto,
          numberChildren: +numberChildren,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: null,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        let savedSupervisor: Supervisor;
        try {
          savedSupervisor =
            await this.supervisorRepository.save(updatedSupervisor);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //? Update in subordinate relations
        const allZones = await this.zoneRepository.find({
          relations: ['theirSupervisor'],
        });

        const allPreachers = await this.preacherRepository.find({
          relations: ['theirSupervisor'],
        });

        const allFamilyGroups = await this.familyGroupRepository.find({
          relations: ['theirSupervisor'],
        });

        const allDisciples = await this.discipleRepository.find({
          relations: ['theirSupervisor'],
        });

        try {
          //* Update and set mew relationships and null copastor in Zone
          const zonesBySupervisor = allZones.filter(
            (zone) => zone.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            zonesBySupervisor.map(async (zone) => {
              await this.zoneRepository.update(zone.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: null,
              });
            }),
          );

          //* Update and set mew relationships and null copastor in Preacher
          const preachersBySupervisor = allPreachers.filter(
            (preacher) => preacher.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            preachersBySupervisor.map(async (preacher) => {
              await this.preacherRepository.update(preacher.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: null,
              });
            }),
          );

          //* Update and set mew relationships and null copastor in Family House
          const familyGroupsBySupervisor = allFamilyGroups.filter(
            (familyGroup) => familyGroup.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            familyGroupsBySupervisor.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: null,
              });
            }),
          );

          //* Update and set mew relationships and null copastor in Disciple
          const disciplesBySupervisor = allDisciples.filter(
            (disciple) => disciple.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            disciplesBySupervisor.map(async (disciple) => {
              await this.discipleRepository.update(disciple.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: null,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }
        return savedSupervisor;
      }

      //? Update and save if is same Copastor
      if (
        supervisor.theirCopastor?.id === theirCopastor &&
        !isDirectRelationToPastor
      ) {
        const updatedSupervisor = await this.supervisorRepository.preload({
          id: supervisor.id,
          ...updateSupervisorDto,
          numberChildren: +numberChildren,
          theirChurch: supervisor.theirChurch,
          theirPastor: supervisor.theirPastor,
          theirCopastor: supervisor.theirCopastor,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          return await this.supervisorRepository.save(updatedSupervisor);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Raise Supervisor level to Co-pastor
    if (
      (supervisor.roles.includes(MemberRoles.Disciple) &&
        supervisor.roles.includes(MemberRoles.Supervisor) &&
        !supervisor.roles.includes(MemberRoles.Treasurer) &&
        !supervisor.roles.includes(MemberRoles.Copastor) &&
        !supervisor.roles.includes(MemberRoles.Preacher) &&
        !supervisor.roles.includes(MemberRoles.Pastor) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Supervisor) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Preacher) &&
        supervisor.status === Status.Active) ||
      (supervisor.roles.includes(MemberRoles.Disciple) &&
        supervisor.roles.includes(MemberRoles.Supervisor) &&
        supervisor.roles.includes(MemberRoles.Treasurer) &&
        !supervisor.roles.includes(MemberRoles.Copastor) &&
        !supervisor.roles.includes(MemberRoles.Preacher) &&
        !supervisor.roles.includes(MemberRoles.Pastor) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Supervisor) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Preacher) &&
        status === Status.Active)
    ) {
      //* Validation new pastor
      if (!theirPastor) {
        throw new NotFoundException(
          `Para subir de nivel de Supervisor a Co-Pastor, debe asignar un Pastor.`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: theirPastor },
        relations: ['theirChurch'],
      });

      if (!newPastor) {
        throw new NotFoundException(`Pastor con id: ${id} no fue encontrado.`);
      }

      if (newPastor.status === Status.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado" en Pastor debe ser "Activo".`,
        );
      }

      //* Validation new church according pastor
      if (!newPastor?.theirChurch) {
        throw new BadRequestException(
          `No se encontró la Iglesia, verifica que Pastor tenga una Iglesia asignado.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newPastor?.theirChurch?.id },
        relations: ['theirMainChurch'],
      });

      if (newChurch.status === Status.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado" en Iglesia debe ser "Activo".`,
        );
      }

      // Create new instance Copastor and delete old Supervisor
      try {
        const newCopastor = this.copastorRepository.create({
          ...updateSupervisorDto,
          numberChildren: +numberChildren,
          theirChurch: newChurch,
          theirPastor: newPastor,
          createdAt: new Date(),
          createdBy: user,
        });

        const savedPastor = await this.copastorRepository.save(newCopastor);

        await this.supervisorRepository.remove(supervisor); // onDelete subordinate entities (null)

        return savedPastor;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    } else {
      throw new BadRequestException(
        `No se puede subir de nivel este registro, el modo debe ser "Activo", los roles ["discípulo", "supervisor"], revisar y actualizar el registro.`,
      );
    }
  }

  //! DELETE SUPERVISOR
  async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const supervisor = await this.supervisorRepository.findOneBy({ id });

    if (!supervisor) {
      throw new NotFoundException(
        `Supervisor con id: ${id} no fue encontrado.`,
      );
    }

    //* Update and set in Inactive on Supervisor
    const updatedSupervisor = await this.supervisorRepository.preload({
      id: supervisor.id,
      theirChurch: null,
      theirPastor: null,
      theirCopastor: null,
      theirZone: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    try {
      await this.supervisorRepository.save(updatedSupervisor);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allZones = await this.zoneRepository.find({
      relations: ['theirSupervisor'],
    });

    const allPreachers = await this.preacherRepository.find({
      relations: ['theirSupervisor'],
    });

    const allFamilyGroup = await this.familyGroupRepository.find({
      relations: ['theirSupervisor'],
    });

    const allDisciples = await this.discipleRepository.find({
      relations: ['theirSupervisor'],
    });

    try {
      //* Update and set to null relationships in Zone
      const zonesBySupervisor = allZones.filter(
        (zone) => zone.theirSupervisor?.id === supervisor?.id,
      );

      await Promise.all(
        zonesBySupervisor.map(async (zone) => {
          await this.zoneRepository.update(zone?.id, {
            theirSupervisor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Preacher
      const preachersBySupervisor = allPreachers.filter(
        (preacher) => preacher.theirSupervisor?.id === supervisor?.id,
      );

      await Promise.all(
        preachersBySupervisor.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirSupervisor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Family House
      const familyGroupsBySupervisor = allFamilyGroup.filter(
        (familyGroup) => familyGroup.theirSupervisor?.id === supervisor?.id,
      );

      await Promise.all(
        familyGroupsBySupervisor.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup.id, {
            theirSupervisor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciple
      const disciplesBySupervisor = allDisciples.filter(
        (disciple) => disciple.theirSupervisor?.id === supervisor.id,
      );

      await Promise.all(
        disciplesBySupervisor.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirSupervisor: null,
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

      if (detail.includes('email')) {
        throw new BadRequestException('El correo electrónico ya está en uso.');
      } else if (detail.includes('church')) {
        throw new BadRequestException('El nombre de iglesia ya está en uso.');
      }
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, revise los registros de consola',
    );
  }
}
