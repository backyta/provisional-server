import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Between, FindOptionsOrderValue, ILike, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberRoles, SearchType, Status } from '@/common/enums';
import { formatToDDMMYYYY, getBirthdaysByMonth } from '@/common/helpers';
import { PaginationDto, SearchTypeAndPaginationDto } from '@/common/dtos';

import { formatDataPastor } from '@/modules/pastor/helpers';
import { CreatePastorDto, UpdatePastorDto } from '@/modules/pastor/dto';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';

@Injectable()
export class PastorService {
  private readonly logger = new Logger('PastorService');

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

  //* CREATE PASTOR
  async create(createPastorDto: CreatePastorDto, user: User): Promise<Pastor> {
    const { roles, numberChildren, theirChurch } = createPastorDto;
    // Validations
    if (
      !roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Pastor)
    ) {
      throw new BadRequestException(
        `El rol "Discípulo" y "Pastor" deben ser incluidos.`,
      );
    }

    if (
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Supervisor) ||
      roles.includes(MemberRoles.Preacher) ||
      roles.includes(MemberRoles.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Pastor, solo se requiere los roles: "Discípulo" y "Pastor".`,
      );
    }

    if (!theirChurch) {
      throw new NotFoundException(
        `Para crear un Pastor, debes asignarle una Iglesia.`,
      );
    }

    //? Validate and assign church
    const church = await this.churchRepository.findOne({
      where: { id: theirChurch },
    });

    if (!church) {
      throw new NotFoundException(
        `No se encontró iglesia con id: ${theirChurch}.`,
      );
    }

    if (church.status === Status.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado" en Iglesia debe ser "Activo".`,
      );
    }

    // Create new instance
    try {
      const newPastor = this.pastorRepository.create({
        ...createPastorDto,
        numberChildren: +numberChildren,
        theirChurch: church,
        createdAt: new Date(),
        createdBy: user,
      });

      return await this.pastorRepository.save(newPastor);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit = 10, offset = 0, order = 'ASC' } = paginationDto;

    const pastors = await this.pastorRepository.find({
      where: { status: Status.Active },
      take: limit,
      skip: offset,
      relations: [
        'updatedBy',
        'createdBy',
        'theirChurch',
        'copastors',
        'supervisors',
        'zones',
        'preachers',
        'familyGroups',
        'disciples',
      ],
      relationLoadStrategy: 'query',
      order: { createdAt: order as FindOptionsOrderValue },
    });

    return formatDataPastor({ pastors }) as any;
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchTypeAndPaginationDto,
  ): Promise<Pastor | Pastor[]> {
    const {
      'search-type': searchType,
      limit = 10,
      offset = 0,
      order,
    } = searchTypeAndPaginationDto;

    //? Find by first name --> Many
    if (term && searchType === SearchType.FirstName) {
      const firstNames = term.replace(/\+/g, ' ');

      const pastors = await this.pastorRepository.find({
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
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron pastores(as) con estos nombres: ${firstNames}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by last name --> Many
    if (term && searchType === SearchType.LastName) {
      const lastNames = term.replace(/\+/g, ' ');

      const pastors = await this.pastorRepository.find({
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
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron pastores(as) con estos apellidos: ${lastNames}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by full name --> Many
    if (term && searchType === SearchType.FullName) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const pastors = await this.pastorRepository.find({
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
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron pastores(as) con estos nombres y apellidos: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
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

      const pastors = await this.pastorRepository.find({
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
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        const fromDate = formatToDDMMYYYY(fromTimestamp);
        const toDate = formatToDDMMYYYY(toTimestamp);

        throw new NotFoundException(
          `No se encontraron pastores(as) con este rango de fechas de nacimiento: ${fromDate} - ${toDate}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === SearchType.BirthMonth) {
      const pastors = await this.pastorRepository.find({
        where: {
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const resultPastors = getBirthdaysByMonth({ month: term, data: pastors });

      if (resultPastors.length === 0) {
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
          `No se encontraron pastores(as) con este mes de nacimiento: ${monthInSpanish}`,
        );
      }

      try {
        return formatDataPastor({ pastors: resultPastors as Pastor[] }) as any;
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

      const pastors = await this.pastorRepository.find({
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
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        const genderNames = {
          male: 'Masculino',
          female: 'Femenino',
        };

        const genderInSpanish = genderNames[term.toLowerCase()] ?? term;

        throw new NotFoundException(
          `No se encontraron pastores(as) con este genero: ${genderInSpanish}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
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

      const pastors = await this.pastorRepository.find({
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
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
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
          `No se encontraron pastores(as) con este estado civil: ${maritalStatusInSpanish}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === SearchType.OriginCountry) {
      const pastors = await this.pastorRepository.find({
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
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron pastores(as) con este país de origen: ${term}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by department --> Many
    if (term && searchType === SearchType.Department) {
      const pastors = await this.pastorRepository.find({
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
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron pastores(as) con este departamento: ${term}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by province --> Many
    if (term && searchType === SearchType.Province) {
      const pastors = await this.pastorRepository.find({
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
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron pastores(as) con esta provincia: ${term}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by district --> Many
    if (term && searchType === SearchType.District) {
      const pastors = await this.pastorRepository.find({
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
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron pastores(as) con este distrito: ${term}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === SearchType.UrbanSector) {
      const pastors = await this.pastorRepository.find({
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
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron pastores(as) con este sector urbano: ${term}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by address --> Many
    if (term && searchType === SearchType.Address) {
      const statusTerm = term.toLowerCase();
      const validStatus = ['active', 'inactive'];

      if (!validStatus.includes(statusTerm)) {
        throw new BadRequestException(`Estado no válido: ${term}`);
      }

      const pastors = await this.pastorRepository.find({
        where: {
          address: statusTerm,
          status: Status.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        throw new NotFoundException(
          `No se encontraron pastores(as) con esta dirección: ${term}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by status --> Many
    if (term && searchType === SearchType.Status) {
      const pastors = await this.pastorRepository.find({
        where: {
          status: ILike(`%${term}%`),
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        const value = term === 'inactive' ? 'Inactivo' : 'Activo';

        throw new NotFoundException(
          `No se encontraron pastores(as) con este estado: ${value}`,
        );
      }

      try {
        return formatDataPastor({ pastors }) as any;
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
  }

  //* UPDATE PASTOR
  async update(
    id: string,
    updatePastorDto: UpdatePastorDto,
    user: User,
  ): Promise<Pastor> {
    const { roles, status, numberChildren, theirChurch } = updatePastorDto;

    // Validations
    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar el pastor.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: id },
      relations: ['theirChurch'],
    });

    if (!pastor) {
      throw new NotFoundException(`Pastor con id: ${id} no encontrado.`);
    }

    if (!roles.some((role) => ['disciple', 'pastor'].includes(role))) {
      throw new BadRequestException(
        `Los roles deben incluir "discípulo" y  "pastor"`,
      );
    }

    if (
      pastor.roles.includes(MemberRoles.Pastor) &&
      pastor.roles.includes(MemberRoles.Disciple) &&
      !pastor.roles.includes(MemberRoles.Preacher) &&
      !pastor.roles.includes(MemberRoles.Supervisor) &&
      !pastor.roles.includes(MemberRoles.Copastor) &&
      !pastor.roles.includes(MemberRoles.Treasurer) &&
      (roles.includes(MemberRoles.Supervisor) ||
        roles.includes(MemberRoles.Copastor) ||
        roles.includes(MemberRoles.Preacher) ||
        roles.includes(MemberRoles.Treasurer))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol inferior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor]`,
      );
    }

    //* Update info about Pastor
    if (
      pastor.roles.includes(MemberRoles.Disciple) &&
      pastor.roles.includes(MemberRoles.Pastor) &&
      !pastor.roles.includes(MemberRoles.Copastor) &&
      !pastor.roles.includes(MemberRoles.Supervisor) &&
      !pastor.roles.includes(MemberRoles.Preacher) &&
      !pastor.roles.includes(MemberRoles.Treasurer) &&
      roles.includes(MemberRoles.Disciple) &&
      roles.includes(MemberRoles.Pastor) &&
      !roles.includes(MemberRoles.Copastor) &&
      !roles.includes(MemberRoles.Supervisor) &&
      !roles.includes(MemberRoles.Preacher) &&
      !roles.includes(MemberRoles.Treasurer)
    ) {
      if (pastor.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //? Update if their Church is different
      if (pastor.theirChurch?.id !== theirChurch) {
        //* Validate church
        if (!theirChurch) {
          throw new NotFoundException(
            `Para poder actualizar un Pastor, se debe asignar una Iglesia.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: theirChurch },
        });

        if (!newChurch) {
          throw new NotFoundException(
            `Iglesia con id ${theirChurch} no fue encontrado.`,
          );
        }

        if (newChurch.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad estado en Iglesia debe ser "Activo".`,
          );
        }

        // Update and save
        const updatedPastor = await this.pastorRepository.preload({
          id: pastor.id,
          ...updatePastorDto,
          numberChildren: +numberChildren,
          theirChurch: newChurch,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        let savedPastor: Pastor;
        try {
          savedPastor = await this.pastorRepository.save(updatedPastor);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //? Update in subordinate relations
        const allCopastors = await this.copastorRepository.find({
          relations: ['theirPastor'],
        });

        const allSupervisors = await this.supervisorRepository.find({
          relations: ['theirPastor'],
        });

        const allZones = await this.zoneRepository.find({
          relations: ['theirPastor'],
        });

        const allPreachers = await this.preacherRepository.find({
          relations: ['theirPastor'],
        });

        const allFamilyGroups = await this.familyGroupRepository.find({
          relations: ['theirPastor'],
        });

        const allDisciples = await this.discipleRepository.find({
          relations: ['theirPastor'],
        });

        try {
          //* Update and set new relationships in Copastor
          const copastorsByPastor = allCopastors.filter(
            (copastor) => copastor.theirPastor?.id === pastor?.id,
          );

          await Promise.all(
            copastorsByPastor.map(async (copastor) => {
              await this.copastorRepository.update(copastor.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Supervisor
          const supervisorsByPastor = allSupervisors.filter(
            (supervisor) => supervisor.theirPastor?.id === pastor.id,
          );

          await Promise.all(
            supervisorsByPastor.map(async (supervisor) => {
              await this.supervisorRepository.update(supervisor.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Zone
          const zonesByPastor = allZones.filter(
            (zone) => zone.theirPastor?.id === pastor.id,
          );

          await Promise.all(
            zonesByPastor.map(async (zone) => {
              await this.zoneRepository.update(zone.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Preacher
          const preachersByPastor = allPreachers.filter(
            (preacher) => preacher.theirPastor?.id === pastor.id,
          );

          await Promise.all(
            preachersByPastor.map(async (preacher) => {
              await this.preacherRepository.update(preacher.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Family House
          const familyGroupsByPastor = allFamilyGroups.filter(
            (familyGroup) => familyGroup.theirPastor?.id === pastor.id,
          );

          await Promise.all(
            familyGroupsByPastor.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Disciple
          const disciplesByPastor = allDisciples.filter(
            (disciple) => disciple.theirPastor?.id === pastor.id,
          );

          await Promise.all(
            disciplesByPastor.map(async (disciple) => {
              await this.discipleRepository.update(disciple.id, {
                theirChurch: newChurch,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }

        return savedPastor;
      }

      //? Update and save if is same Church
      if (pastor.theirChurch?.id === theirChurch) {
        const updatedPastor = await this.pastorRepository.preload({
          id: pastor.id,
          ...updatePastorDto,
          numberChildren: +numberChildren,
          theirChurch: pastor.theirChurch,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          return await this.pastorRepository.save(updatedPastor);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }
  }

  //! DELETE PASTOR
  async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const pastor = await this.pastorRepository.findOneBy({ id });

    if (!pastor) {
      throw new NotFoundException(`Pastor con id: ${id} no existe.`);
    }

    //* Update and set in Inactive on Pastor
    const updatedPastor = await this.pastorRepository.preload({
      id: pastor.id,
      theirChurch: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    try {
      await this.pastorRepository.save(updatedPastor);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allCopastores = await this.copastorRepository.find({
      relations: ['theirPastor'],
    });

    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirPastor'],
    });

    const allZones = await this.zoneRepository.find({
      relations: ['theirPastor'],
    });

    const allPreachers = await this.preacherRepository.find({
      relations: ['theirPastor'],
    });

    const allFamilyGroups = await this.familyGroupRepository.find({
      relations: ['theirPastor'],
    });

    const allDisciples = await this.discipleRepository.find({
      relations: ['theirPastor'],
    });

    try {
      //* Update and set to null relationships in Copastor
      const copastorsByPastor = allCopastores.filter(
        (copastor) => copastor.theirPastor?.id === pastor?.id,
      );

      await Promise.all(
        copastorsByPastor.map(async (copastor) => {
          await this.copastorRepository.update(copastor?.id, {
            theirPastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Supervisor
      const supervisorsByPastor = allSupervisors.filter(
        (supervisor) => supervisor.theirPastor?.id === pastor?.id,
      );

      await Promise.all(
        supervisorsByPastor.map(async (supervisor) => {
          await this.supervisorRepository.update(supervisor?.id, {
            theirPastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Zone
      const zonesByPastor = allZones.filter(
        (zone) => zone.theirPastor?.id === pastor?.id,
      );

      await Promise.all(
        zonesByPastor.map(async (zone) => {
          await this.zoneRepository.update(zone?.id, {
            theirPastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Preacher
      const preachersByPastor = allPreachers.filter(
        (preacher) => preacher.theirPastor?.id === pastor?.id,
      );

      await Promise.all(
        preachersByPastor.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirPastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Family House
      const familyGroupsByPastor = allFamilyGroups.filter(
        (familyGroup) => familyGroup.theirPastor?.id === pastor.id,
      );

      await Promise.all(
        familyGroupsByPastor.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup.id, {
            theirPastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciple
      const disciplesByPastor = allDisciples.filter(
        (disciple) => disciple.theirPastor?.id === pastor.id,
      );

      await Promise.all(
        disciplesByPastor.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirPastor: null,
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
