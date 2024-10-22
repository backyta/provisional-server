import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, ILike, In, Repository } from 'typeorm';

import {
  CopastorSearchType,
  CopastorSearchSubType,
  CopastorSearchTypeNames,
} from '@/modules/copastor/enums';
import { copastorDataFormatter } from '@/modules/copastor/helpers';
import { CreateCopastorDto, UpdateCopastorDto } from '@/modules/copastor/dto';

import {
  MemberRole,
  GenderNames,
  RecordStatus,
  MaritalStatusNames,
} from '@/common/enums';
import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';
import { dateFormatterToDDMMYYYY, getBirthDateByMonth } from '@/common/helpers';

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

    if (
      !roles.includes(MemberRole.Disciple) &&
      !roles.includes(MemberRole.Copastor)
    ) {
      throw new BadRequestException(
        `El rol "Discípulo" y "Co-Pastor" deben ser incluidos.`,
      );
    }

    if (
      roles.includes(MemberRole.Pastor) ||
      roles.includes(MemberRole.Supervisor) ||
      roles.includes(MemberRole.Preacher) ||
      roles.includes(MemberRole.Treasurer)
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

    const pastor = await this.pastorRepository.findOne({
      where: { id: theirPastor },
      relations: ['theirChurch'],
    });

    if (!pastor) {
      throw new NotFoundException(
        `No se encontró Pastor con el id: ${theirPastor}.`,
      );
    }

    if (pastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
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

    if (church?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
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
      if (error instanceof NotFoundException) {
        throw error;
      }

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
      churchId: churchId,
    } = paginationDto;

    if (isSimpleQuery || (churchId && isSimpleQuery)) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastors = await this.copastorRepository.find({
          where: { theirChurch: church, recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return copastors;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    try {
      const copastors = await this.copastorRepository.find({
        where: { recordStatus: RecordStatus.Active },
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

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return copastorDataFormatter({ copastors }) as any;
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
  ): Promise<Copastor | Copastor[]> {
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
    //* Copastors by copastor names
    if (
      term &&
      searchType === CopastorSearchType.FirstName &&
      searchSubType === CopastorSearchSubType.ByCopastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            recordStatus: RecordStatus.Active,
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
            `No se encontraron co-pastores(as) con estos nombres: ${firstNames}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Copastors by pastor names
    if (
      term &&
      searchType === CopastorSearchType.FirstName &&
      searchSubType === CopastorSearchSubType.CopastorByPastorNames
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

        const copastors = await this.copastorRepository.find({
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
            `No se encontraron co-pastores(as) por los nombres de su pastor: ${firstNames}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by last name --> Many
    //* Copastors by last names
    if (
      term &&
      searchType === CopastorSearchType.LastName &&
      searchSubType === CopastorSearchSubType.ByCopastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            lastName: ILike(`%${lastNames}%`),
            recordStatus: RecordStatus.Active,
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
            `No se encontraron co-pastores(as) con estos apellidos: ${lastNames}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Copastors by pastor last names
    if (
      term &&
      searchType === CopastorSearchType.LastName &&
      searchSubType === CopastorSearchSubType.CopastorByPastorLastNames
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

        const copastors = await this.copastorRepository.find({
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
            `No se encontraron co-pastores(as) por los apellidos de su pastor: ${lastNames}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by full name --> Many
    //* Copastors by full names
    if (
      term &&
      searchType === CopastorSearchType.FullName &&
      searchSubType === CopastorSearchSubType.ByCopastorFullName
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
            `No se encontraron co-pastores(as) con estos nombres y apellidos: ${firstNames} ${lastNames}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Copastors by pastor full names
    if (
      term &&
      searchType === CopastorSearchType.FullName &&
      searchSubType === CopastorSearchSubType.CopastorByPastorFullName
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

        const copastors = await this.copastorRepository.find({
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
            `No se encontraron co-pastores(as) por los nombres y apellidos de su pastor: ${lastNames}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by birth date --> Many
    if (term && searchType === CopastorSearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            birthDate: Between(fromDate, toDate),
            recordStatus: RecordStatus.Active,
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
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este rango de fechas de nacimiento: ${fromDate} - ${toDate}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === CopastorSearchType.BirthMonth) {
      try {
        const copastors = await this.copastorRepository.find({
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
            'supervisors',
            'zones',
            'preachers',
            'familyGroups',
            'disciples',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const resultCopastors = getBirthDateByMonth({
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

        return copastorDataFormatter({
          copastors: resultCopastors as Copastor[],
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by gender --> Many
    if (term && searchType === CopastorSearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            gender: genderTerm,
            recordStatus: RecordStatus.Active,
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
          const genderInSpanish = GenderNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este género: ${genderInSpanish}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by marital status --> Many
    if (term && searchType === CopastorSearchType.MaritalStatus) {
      try {
        const maritalStatusTerm = term.toLowerCase();
        const validMaritalStatus = [
          'single',
          'married',
          'widowed',
          'divorced',
          'other',
        ];

        if (!validMaritalStatus.includes(maritalStatusTerm)) {
          throw new BadRequestException(`Estado Civil no válido: ${term}`);
        }

        const copastors = await this.copastorRepository.find({
          where: {
            maritalStatus: maritalStatusTerm,
            recordStatus: RecordStatus.Active,
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
          const maritalStatusInSpanish =
            MaritalStatusNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este estado civil: ${maritalStatusInSpanish}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === CopastorSearchType.OriginCountry) {
      try {
        const copastors = await this.copastorRepository.find({
          where: {
            originCountry: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
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

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by department --> Many
    if (term && searchType === CopastorSearchType.Department) {
      try {
        const copastors = await this.copastorRepository.find({
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

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by province --> Many
    if (term && searchType === CopastorSearchType.Province) {
      try {
        const copastors = await this.copastorRepository.find({
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

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by district --> Many
    if (term && searchType === CopastorSearchType.District) {
      try {
        const copastors = await this.copastorRepository.find({
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

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === CopastorSearchType.UrbanSector) {
      try {
        const copastors = await this.copastorRepository.find({
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

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by address --> Many
    if (term && searchType === CopastorSearchType.Address) {
      try {
        const copastors = await this.copastorRepository.find({
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

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by status --> Many
    if (term && searchType === CopastorSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', RecordStatus.Inactive];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      try {
        const copastors = await this.copastorRepository.find({
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
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este estado de registro: ${value}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
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
      !Object.values(CopastorSearchType).includes(
        searchType as CopastorSearchType,
      )
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(CopastorSearchTypeNames).join(', ')}`,
      );
    }

    if (
      term &&
      (CopastorSearchType.FirstName ||
        CopastorSearchType.LastName ||
        CopastorSearchType.FullName) &&
      !searchSubType
    ) {
      throw new BadRequestException(
        `Para buscar por nombres o apellidos el sub-tipo es requerido.`,
      );
    }
  }

  //* UPDATE COPASTOR
  async update(
    id: string,
    updateCopastorDto: UpdateCopastorDto,
    user: User,
  ): Promise<Copastor | Pastor> {
    const { roles, recordStatus, numberChildren, theirPastor, theirChurch } =
      updateCopastorDto;

    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar un Co-Pastor.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

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
      copastor.roles.includes(MemberRole.Copastor) &&
      copastor.roles.includes(MemberRole.Disciple) &&
      !copastor.roles.includes(MemberRole.Preacher) &&
      !copastor.roles.includes(MemberRole.Supervisor) &&
      !copastor.roles.includes(MemberRole.Pastor) &&
      !copastor.roles.includes(MemberRole.Treasurer) &&
      (roles.includes(MemberRole.Supervisor) ||
        roles.includes(MemberRole.Preacher) ||
        roles.includes(MemberRole.Treasurer))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol inferior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor]`,
      );
    }

    //* Update info about Copastor
    if (
      copastor.roles.includes(MemberRole.Disciple) &&
      copastor.roles.includes(MemberRole.Copastor) &&
      !copastor.roles.includes(MemberRole.Pastor) &&
      !copastor.roles.includes(MemberRole.Supervisor) &&
      !copastor.roles.includes(MemberRole.Preacher) &&
      !copastor.roles.includes(MemberRole.Treasurer) &&
      roles.includes(MemberRole.Disciple) &&
      roles.includes(MemberRole.Copastor) &&
      !roles.includes(MemberRole.Pastor) &&
      !roles.includes(MemberRole.Supervisor) &&
      !roles.includes(MemberRole.Preacher) &&
      !roles.includes(MemberRole.Treasurer)
    ) {
      if (
        copastor?.recordStatus === RecordStatus.Active &&
        recordStatus === RecordStatus.Inactive
      ) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //? Update if their Pastor is different
      if (copastor?.theirPastor?.id !== theirPastor) {
        //* Validate pastor
        if (!theirPastor) {
          throw new NotFoundException(
            `Para poder actualizar un Co-Pastor, se debe asignar un Pastor.`,
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

        if (newPastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
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

        if (newChurch?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        // Update and save
        let savedCopastor: Copastor;
        try {
          const updatedCopastor = await this.copastorRepository.preload({
            id: copastor.id,
            ...updateCopastorDto,
            numberChildren: +numberChildren,
            theirChurch: newChurch,
            theirPastor: newPastor,
            updatedAt: new Date(),
            updatedBy: user,
            recordStatus: recordStatus,
          });

          savedCopastor = await this.copastorRepository.save(updatedCopastor);
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

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
          //* Update and set new relationships in Supervisor
          const supervisorsByCopastor = allSupervisors.filter(
            (supervisor) => supervisor?.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            supervisorsByCopastor.map(async (supervisor) => {
              await this.supervisorRepository.update(supervisor?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
              });
            }),
          );

          //* Update and set new relationships in Zone
          const zonesByCopastor = allZones.filter(
            (zone) => zone?.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            zonesByCopastor.map(async (zone) => {
              await this.zoneRepository.update(zone?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
              });
            }),
          );

          //* Update and set new relationships in Preacher
          const preachersByCopastor = allPreachers.filter(
            (preacher) => preacher?.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            preachersByCopastor.map(async (preacher) => {
              await this.preacherRepository.update(preacher?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
              });
            }),
          );

          //* Update and set new relationships in Family group
          const familyGroupsByCopastor = allFamilyGroups.filter(
            (familyGroup) => familyGroup?.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            familyGroupsByCopastor.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
              });
            }),
          );

          //* Update and set new relationships in Disciple
          const disciplesByCopastor = allDisciples.filter(
            (disciple) => disciple?.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            disciplesByCopastor.map(async (disciple) => {
              await this.discipleRepository.update(disciple?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
              });
            }),
          );
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }

        return savedCopastor;
      }

      //? Update and save if is same Pastor
      if (copastor?.theirPastor?.id === theirPastor) {
        const updatedCopastor = await this.copastorRepository.preload({
          id: copastor.id,
          ...updateCopastorDto,
          numberChildren: +numberChildren,
          theirChurch: copastor.theirChurch,
          theirPastor: copastor.theirPastor,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        try {
          return await this.copastorRepository.save(updatedCopastor);
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Raise Co-pastor level to Pastor
    if (
      copastor.roles.includes(MemberRole.Disciple) &&
      copastor.roles.includes(MemberRole.Copastor) &&
      !copastor.roles.includes(MemberRole.Treasurer) &&
      !copastor.roles.includes(MemberRole.Supervisor) &&
      !copastor.roles.includes(MemberRole.Preacher) &&
      !copastor.roles.includes(MemberRole.Pastor) &&
      roles.includes(MemberRole.Disciple) &&
      roles.includes(MemberRole.Pastor) &&
      !roles.includes(MemberRole.Treasurer) &&
      !roles.includes(MemberRole.Supervisor) &&
      !roles.includes(MemberRole.Copastor) &&
      !roles.includes(MemberRole.Preacher) &&
      copastor.recordStatus === RecordStatus.Active
    ) {
      //* Validation new church
      if (!theirChurch) {
        throw new NotFoundException(
          `Para promover de Co-Pastor a Pastor se le debe asignar una Iglesia.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: theirChurch },
        relations: ['theirMainChurch'],
      });

      if (!newChurch) {
        throw new NotFoundException(`Iglesia con id: ${id} no fue encontrada.`);
      }

      if (newChurch?.recordStatus == RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activa".`,
        );
      }

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
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    } else {
      throw new BadRequestException(
        `No se puede subir de nivel este Co-Pastor, el modo debe ser "Activo", y los roles deben ser: ["discípulo", "pastor"], revisar y actualizar el registro.`,
      );
    }
  }

  //! DELETE COPASTOR
  async remove(id: string, user: User): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const copastor = await this.copastorRepository.findOneBy({ id });

    if (!copastor) {
      throw new NotFoundException(`Co-Pastor con id: ${id} no fue encontrado.`);
    }

    //* Update and set to Inactive on Copastor
    try {
      const updatedCopastor = await this.copastorRepository.preload({
        id: copastor.id,
        theirChurch: null,
        theirPastor: null,
        updatedAt: new Date(),
        updatedBy: user,
        recordStatus: RecordStatus.Inactive,
      });

      await this.copastorRepository.save(updatedCopastor);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

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
        (supervisor) => supervisor?.theirCopastor?.id === copastor?.id,
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
        (zone) => zone?.theirCopastor?.id === copastor?.id,
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
        (preacher) => preacher?.theirCopastor?.id === copastor?.id,
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

      //* Update and set to null relationships in Family Group
      const familyGroupsByCopastor = allFamilyGroups.filter(
        (familyGroup) => familyGroup?.theirCopastor?.id === copastor?.id,
      );

      await Promise.all(
        familyGroupsByCopastor.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup?.id, {
            theirCopastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciple
      const disciplesByCopastor = allDisciples.filter(
        (disciple) => disciple?.theirCopastor?.id === copastor?.id,
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
      if (error instanceof NotFoundException) {
        throw error;
      }

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
      }
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador y que revise los registros de consola.',
    );
  }
}
