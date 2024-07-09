import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Between, FindOptionsOrderValue, ILike, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';

import { MemberRoles, SearchSubType, SearchType, Status } from '@/common/enums';
import { PaginationDto, SearchTypeAndPaginationDto } from '@/common/dtos';
import { formatToDDMMYYYY, getBirthdaysByMonth } from '@/common/helpers';

import { formatDataCopastor } from '@/modules/copastor/helpers';
import { CreateCopastorDto, UpdateCopastorDto } from '@/modules/copastor/dto';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';

@Injectable()
export class CopastorService {
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

  //* CREATE COPASTOR
  async create(
    createCopastorDto: CreateCopastorDto,
    user: User,
  ): Promise<Copastor> {
    const { roles, theirPastor, numberChildren } = createCopastorDto;

    // Validations
    if (
      !roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Copastor)
    ) {
      throw new BadRequestException(
        `El rol "Discípulo" y "Co-Pastor" deben ser incluidos.`,
      );
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Supervisor) ||
      roles.includes(MemberRoles.Preacher) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Co-Pastor, solo se requiere los roles: "Discípulo" y "Co-Pastor".`,
      );
    }

    if (!theirPastor) {
      throw new NotFoundException(
        `Para crear un Co-Pastor, debes asignarle un Pastor.`,
      );
    }

    //* Validate and assign pastor
    const pastor = await this.pastorRepository.findOne({
      where: { id: theirPastor },
      relations: ['theirChurch'],
    });

    if (!pastor) {
      throw new NotFoundException(
        `No se encontró Pastor con el id: ${theirPastor}.`,
      );
    }

    if (pastor.status === Status.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado" en Pastor debe ser "Activo".`,
      );
    }

    //* Validate church according pastor
    if (!pastor?.theirChurch) {
      throw new NotFoundException(
        `No se encontró la Iglesia, verifique que el Pastor tenga una Iglesia asignada`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: pastor?.theirChurch?.id },
    });

    if (church.status === Status.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado" en Iglesia debe ser "Activo".`,
      );
    }

    // Create new instance
    try {
      const newCopastor = this.copastorRepository.create({
        ...createCopastorDto,
        numberChildren: +numberChildren,
        theirChurch: church,
        theirPastor: pastor,
        createdAt: new Date(),
        createdBy: user,
      });

      return await this.copastorRepository.save(newCopastor);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit = 10, offset = 0, order = 'ASC' } = paginationDto;

    const copastors = await this.copastorRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'updatedBy',
        'createdBy',
        'theirPastor',
        'theirChurch',
        'supervisors',
        'zones',
        'preachers',
        'familyGroups',
        'disciples',
      ],
      relationLoadStrategy: 'query',
      order: { createdAt: order as FindOptionsOrderValue },
    });

    return formatDataCopastor({ copastors }) as any;
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchTypeAndPaginationDto,
  ): Promise<Copastor | Copastor[]> {
    const {
      'search-type': searchType,
      'search-sub-type': searchSubType,
      limit = 10,
      offset = 0,
      order,
    } = searchTypeAndPaginationDto;

    //? Find by first name () --> Many
    //* Copastors by copastor names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.ByCopastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con este nombre: ${firstNames}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Copastors by pastor names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.CopastorByPastorNames
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

      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con este nombre: ${firstNames}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by last name --> Many
    //* Copastors by last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.ByCopastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con esos apellidos: ${lastNames}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Copastors by pastor last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.CopastorByPastorLastNames
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

      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con este apellido: ${lastNames}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by full name --> Many
    //* Copastors by full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.ByCopastorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con esos nombres y apellidos: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Copastors by pastor full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.CopastorByPastorFullName
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

      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con esos nombres y apellidos:: ${lastNames}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
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

      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        const fromDate = formatToDDMMYYYY(fromTimestamp);
        const toDate = formatToDDMMYYYY(toTimestamp);

        throw new NotFoundException(
          `No se encontraron co-pastores(as) con estas fechas de nacimiento: ${fromDate} - ${toDate}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === SearchType.BirthMonth) {
      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const resultCopastors = getBirthdaysByMonth({
        month: term,
        data: copastors,
      });

      if (resultCopastors.length === 0) {
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
          `No se encontraron co-pastores(as) con este mes de nacimiento: ${monthInSpanish}`,
        );
      }

      try {
        return formatDataCopastor({
          copastors: resultCopastors as Copastor[],
        }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by gender --> Many
    if (term && searchType === SearchType.Gender) {
      const copastors = await this.copastorRepository.find({
        where: {
          gender: ILike(`%${term}%`),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con este genero: ${term}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by marital status --> Many
    if (term && searchType === SearchType.MaritalStatus) {
      const copastors = await this.copastorRepository.find({
        where: {
          maritalStatus: ILike(`%${term}%`),
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
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
          `No se encontraron co-pastores(as) con este estado civil: ${maritalStatusInSpanish}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === SearchType.OriginCountry) {
      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con este país de origen: ${term}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by department --> Many
    if (term && searchType === SearchType.Department) {
      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con este departamento: ${term}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by province --> Many
    if (term && searchType === SearchType.Province) {
      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con esta provincia: ${term}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by district --> Many
    if (term && searchType === SearchType.District) {
      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con este distrito: ${term}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === SearchType.UrbanSector) {
      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con este sector urbano: ${term}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by address --> Many
    if (term && searchType === SearchType.Address) {
      const copastors = await this.copastorRepository.find({
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
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron co-pastores(as) con esta dirección: ${term}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by status --> Many
    if (term && searchType === SearchType.Status) {
      const copastors = await this.copastorRepository.find({
        where: {
          status: ILike(`%${term}%`),
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        const value = term === 'inactive' ? 'Inactivo' : 'Activo';

        throw new NotFoundException(
          `No se encontraron co-pastores(as) con este estado: ${value}`,
        );
      }

      try {
        return formatDataCopastor({ copastors }) as any;
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

  //* UPDATE COPASTOR
  async update(
    id: string,
    updateCopastorDto: UpdateCopastorDto,
    user: User,
  ): Promise<Copastor | Pastor> {
    const { roles, status, numberChildren, theirPastor, theirChurch } =
      updateCopastorDto;

    // Validations
    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar un Co-Pastor.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    // Validation copastor
    const copastor = await this.copastorRepository.findOne({
      where: { id: id },
      relations: ['theirPastor', 'theirChurch'],
    });

    if (!copastor) {
      throw new NotFoundException(`No se encontró Co-Pastor con el id: ${id}`);
    }

    if (!roles.some((role) => ['disciple', 'copastor'].includes(role))) {
      throw new BadRequestException(
        `Los roles "Discípulo" y "Co-Pastor" deben ser incluidos.`,
      );
    }

    if (
      copastor.roles.includes(MemberRoles.Copastor) &&
      copastor.roles.includes(MemberRoles.Disciple) &&
      !copastor.roles.includes(MemberRoles.Preacher) &&
      !copastor.roles.includes(MemberRoles.Supervisor) &&
      !copastor.roles.includes(MemberRoles.Pastor) &&
      !copastor.roles.includes(MemberRoles.Treasurer) &&
      (roles.includes(MemberRoles.Supervisor) ||
        roles.includes(MemberRoles.Preacher) ||
        roles.includes(MemberRoles.Treasurer))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol inferior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor]`,
      );
    }

    //* Update info about Copastor
    if (
      copastor.roles.includes(MemberRoles.Disciple) &&
      copastor.roles.includes(MemberRoles.Copastor) &&
      !copastor.roles.includes(MemberRoles.Pastor) &&
      !copastor.roles.includes(MemberRoles.Supervisor) &&
      !copastor.roles.includes(MemberRoles.Preacher) &&
      !copastor.roles.includes(MemberRoles.Treasurer) &&
      roles.includes(MemberRoles.Disciple) &&
      roles.includes(MemberRoles.Copastor) &&
      !roles.includes(MemberRoles.Pastor) &&
      !roles.includes(MemberRoles.Supervisor) &&
      !roles.includes(MemberRoles.Preacher) &&
      !roles.includes(MemberRoles.Treasurer)
    ) {
      if (copastor.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //? Update if their Pastor is different
      if (copastor.theirPastor?.id !== theirPastor) {
        //* Validate pastor
        if (!theirPastor) {
          throw new NotFoundException(
            `Para poder actualizar un Co-Pastor, se debe asignar una Pastor.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: theirPastor },
          relations: ['theirChurch'],
        });

        if (!newPastor) {
          throw new NotFoundException(
            `Pastor con el id: ${theirPastor}, no fue encontrado.`,
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
            `No se encontró la Iglesia, verificar que Pastor tenga una Iglesia asignada.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newPastor?.theirChurch?.id },
          relations: ['theirMainChurch'],
        });

        if (newChurch.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado" en Iglesia debe ser "Activo".`,
          );
        }

        // Update and save
        const updatedCopastor = await this.copastorRepository.preload({
          id: copastor.id,
          ...updateCopastorDto,
          numberChildren: +numberChildren,
          theirChurch: newChurch,
          theirPastor: newPastor,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        let savedCopastor: Copastor;
        try {
          savedCopastor = await this.copastorRepository.save(updatedCopastor);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //? Update in subordinate relations
        const allSupervisors = await this.supervisorRepository.find({
          relations: ['theirCopastor'],
        });
        const allZones = await this.zoneRepository.find({
          relations: ['theirCopastor'],
        });
        const allPreachers = await this.preacherRepository.find({
          relations: ['theirCopastor'],
        });
        const allFamilyGroups = await this.familyGroupRepository.find({
          relations: ['theirCopastor'],
        });
        const allDisciples = await this.discipleRepository.find({
          relations: ['theirCopastor'],
        });

        try {
          //* Update and set to null relationships in Supervisor
          const supervisorsByCopastor = allSupervisors.filter(
            (supervisor) => supervisor.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            supervisorsByCopastor.map(async (supervisor) => {
              await this.supervisorRepository.update(supervisor.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
              });
            }),
          );

          //* Update and set to null relationships in Zone
          const zonesByCopastor = allZones.filter(
            (zone) => zone.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            zonesByCopastor.map(async (zone) => {
              await this.zoneRepository.update(zone.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
              });
            }),
          );

          //* Update and set to null relationships in Preacher
          const preachersByCopastor = allPreachers.filter(
            (preacher) => preacher.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            preachersByCopastor.map(async (preacher) => {
              await this.preacherRepository.update(preacher.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
              });
            }),
          );

          //* Update and set to null relationships in Family House
          const familyGroupsByCopastor = allFamilyGroups.filter(
            (familyGroup) => familyGroup.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            familyGroupsByCopastor.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
              });
            }),
          );

          //* Update and set to null relationships in Disciple
          const disciplesByCopastor = allDisciples.filter(
            (disciple) => disciple.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            disciplesByCopastor.map(async (disciple) => {
              await this.discipleRepository.update(disciple.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }

        return savedCopastor;
      }

      if (copastor.theirPastor?.id === theirPastor) {
        //? Update and save if is same Pastor
        const updatedCopastor = await this.copastorRepository.preload({
          id: copastor.id,
          ...updateCopastorDto,
          numberChildren: +numberChildren,
          theirChurch: copastor.theirChurch,
          theirPastor: copastor.theirPastor,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          return await this.copastorRepository.save(updatedCopastor);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Raise Co-pastor level to Pastor
    if (
      copastor.roles.includes(MemberRoles.Disciple) &&
      copastor.roles.includes(MemberRoles.Copastor) &&
      !copastor.roles.includes(MemberRoles.Treasurer) &&
      !copastor.roles.includes(MemberRoles.Supervisor) &&
      !copastor.roles.includes(MemberRoles.Preacher) &&
      !copastor.roles.includes(MemberRoles.Pastor) &&
      roles.includes(MemberRoles.Disciple) &&
      roles.includes(MemberRoles.Pastor) &&
      !roles.includes(MemberRoles.Treasurer) &&
      !roles.includes(MemberRoles.Supervisor) &&
      !roles.includes(MemberRoles.Copastor) &&
      !roles.includes(MemberRoles.Preacher) &&
      copastor.status === Status.Active
    ) {
      //* Validation new church
      if (!theirChurch) {
        throw new NotFoundException(
          `Para promover de Co-Pastor a Pastor asigne una Iglesia existente.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: theirChurch },
        relations: ['theirMainChurch'],
      });

      if (!newChurch) {
        throw new NotFoundException(`Iglesia con id: ${id} no fue encontrada.`);
      }

      if (newChurch.status == Status.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado" en Iglesia debe ser "Activa".`,
        );
      }

      // NOTE : Se tiene que mandar todos los campos para crear a un nuevo pastor (front)
      try {
        const newPastor = this.pastorRepository.create({
          ...updateCopastorDto,
          numberChildren: +numberChildren,
          theirChurch: newChurch,
          createdAt: new Date(),
          createdBy: user,
        });

        const savedPastor = this.pastorRepository.save(newPastor);

        await this.copastorRepository.remove(copastor); // onDelete subordinate entities (null)
        return savedPastor;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    } else {
      throw new BadRequestException(
        `No se puede subir de nivel este registro, el modo debe ser "Activo", los roles ["Discípulo", "Pastor"], revisar y actualizar el registro.`,
      );
    }
  }

  //! DELETE COPASTOR
  async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const copastor = await this.copastorRepository.findOneBy({ id });

    if (!copastor) {
      throw new NotFoundException(`Co-Pastor con id: ${id} no fue encontrado.`);
    }

    //* Update and set in Inactive on Copastor
    const updatedCopastor = await this.copastorRepository.preload({
      id: copastor.id,
      theirChurch: null,
      theirPastor: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    try {
      await this.copastorRepository.save(updatedCopastor);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirCopastor'],
    });

    const allZones = await this.zoneRepository.find({
      relations: ['theirCopastor'],
    });

    const allPreachers = await this.preacherRepository.find({
      relations: ['theirCopastor'],
    });

    const allFamilyGroups = await this.familyGroupRepository.find({
      relations: ['theirCopastor'],
    });

    const allDisciples = await this.discipleRepository.find({
      relations: ['theirCopastor'],
    });

    try {
      //* Update and set to null relationships in Supervisor
      const supervisorsByCopastor = allSupervisors.filter(
        (supervisor) => supervisor.theirCopastor?.id === copastor?.id,
      );

      await Promise.all(
        supervisorsByCopastor.map(async (supervisor) => {
          await this.supervisorRepository.update(supervisor?.id, {
            theirCopastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Zone
      const zonesByCopastor = allZones.filter(
        (zone) => zone.theirCopastor?.id === copastor?.id,
      );

      await Promise.all(
        zonesByCopastor.map(async (zone) => {
          await this.zoneRepository.update(zone?.id, {
            theirCopastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Preacher
      const preachersByCopastor = allPreachers.filter(
        (preacher) => preacher.theirCopastor?.id === copastor?.id,
      );

      await Promise.all(
        preachersByCopastor.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirCopastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Family House
      const familyGroupsByCopastor = allFamilyGroups.filter(
        (familyGroup) => familyGroup.theirCopastor?.id === copastor?.id,
      );

      await Promise.all(
        familyGroupsByCopastor.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup.id, {
            theirCopastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciple
      const disciplesByCopastor = allDisciples.filter(
        (disciple) => disciple.theirCopastor?.id === copastor?.id,
      );

      await Promise.all(
        disciplesByCopastor.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirCopastor: null,
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
