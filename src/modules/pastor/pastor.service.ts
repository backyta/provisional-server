import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, ILike, Repository } from 'typeorm';

import {
  PastorSearchType,
  PastorSearchTypeNames,
} from '@/modules/pastor/enums';
import { pastorDataFormatter } from '@/modules/pastor/helpers';
import { CreatePastorDto, UpdatePastorDto } from '@/modules/pastor/dto';

import {
  MemberRole,
  GenderNames,
  RecordStatus,
  MaritalStatusNames,
} from '@/common/enums';
import {
  PaginationDto,
  MemberInactivateDto,
  SearchAndPaginationDto,
} from '@/common/dtos';
import { dateFormatterToDDMMYYYY, getBirthDateByMonth } from '@/common/helpers';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Member } from '@/modules/member/entities';
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

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  //* CREATE PASTOR
  async create(createPastorDto: CreatePastorDto, user: User): Promise<Pastor> {
    const { roles, theirChurch } = createPastorDto;

    if (!roles.includes(MemberRole.Pastor)) {
      throw new BadRequestException(`El rol "Pastor" debe ser incluido.`);
    }

    if (
      roles.includes(MemberRole.Copastor) ||
      roles.includes(MemberRole.Supervisor) ||
      roles.includes(MemberRole.Preacher) ||
      roles.includes(MemberRole.Treasurer) ||
      roles.includes(MemberRole.Disciple)
    ) {
      throw new BadRequestException(
        `Para crear un Pastor, solo se requiere el rol: "Pastor".`,
      );
    }

    if (!theirChurch) {
      throw new NotFoundException(
        `Para crear un Pastor, se debe asignarle una Iglesia.`,
      );
    }

    //? Validate and assign church
    const church = await this.churchRepository.findOne({
      where: { id: theirChurch },
    });

    if (!church) {
      throw new NotFoundException(
        `No se encontró Iglesia con id: ${theirChurch}.`,
      );
    }

    if (church?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    //* Create new instance member and assign to new pastor instance
    try {
      const newMember = this.memberRepository.create({
        firstName: createPastorDto.firstName,
        lastName: createPastorDto.lastName,
        gender: createPastorDto.gender,
        originCountry: createPastorDto.originCountry,
        birthDate: createPastorDto.birthDate,
        maritalStatus: createPastorDto.maritalStatus,
        numberChildren: +createPastorDto.numberChildren,
        conversionDate: createPastorDto.conversionDate,
        email: createPastorDto.email,
        phoneNumber: createPastorDto.phoneNumber,
        country: createPastorDto.country,
        department: createPastorDto.department,
        province: createPastorDto.province,
        district: createPastorDto.district,
        urbanSector: createPastorDto.urbanSector,
        address: createPastorDto.address,
        referenceAddress: createPastorDto.referenceAddress,
        roles: createPastorDto.roles,
      });

      await this.memberRepository.save(newMember);

      const newPastor = this.pastorRepository.create({
        member: newMember,
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
    const {
      limit,
      offset = 0,
      order = 'ASC',
      isSimpleQuery,
      churchId,
    } = paginationDto;

    if (isSimpleQuery) {
      try {
        const pastors = await this.pastorRepository.find({
          where: { recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: ['member'],
        });

        if (pastors.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return pastors;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    try {
      let church: Church;
      if (churchId) {
        church = await this.churchRepository.findOne({
          where: { id: churchId, recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id ${churchId} no fue encontrada.`,
          );
        }
      }

      const pastors = await this.pastorRepository.find({
        where: { recordStatus: RecordStatus.Active, theirChurch: church },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'member',
          'theirChurch',
          'familyGroups',
          'zones',
          'copastors.member',
          'supervisors.member',
          'preachers.member',
          'disciples.member',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (pastors.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return pastorDataFormatter({ pastors }) as any;
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
  ): Promise<Pastor[]> {
    const {
      'search-type': searchType,
      limit,
      offset = 0,
      order,
      churchId,
    } = searchTypeAndPaginationDto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido.`);
    }

    //* Search Church
    let church: Church;
    if (churchId) {
      church = await this.churchRepository.findOne({
        where: { id: churchId, recordStatus: RecordStatus.Active },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (!church) {
        throw new NotFoundException(
          `Iglesia con id ${churchId} no fue encontrada.`,
        );
      }
    }

    //? Find by first name --> Many
    if (term && searchType === PastorSearchType.FirstName) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              firstName: ILike(`%${firstNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron pastores(as) con estos nombres: ${firstNames}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by last name --> Many
    if (term && searchType === PastorSearchType.LastName) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              lastName: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron pastores(as) con estos apellidos: ${lastNames}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by full name --> Many
    if (term && searchType === PastorSearchType.FullName) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              firstName: ILike(`%${firstNames}%`),
              lastName: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron pastores(as) con estos nombres y apellidos: ${firstNames} ${lastNames}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by birth date --> Many
    if (term && searchType === PastorSearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      try {
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              birthDate: Between(fromDate, toDate),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron pastores(as) con este rango de fechas de nacimiento: ${fromDate} - ${toDate}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === PastorSearchType.BirthMonth) {
      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const resultPastors = getBirthDateByMonth({
          month: term,
          data: pastors,
        });

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

        return pastorDataFormatter({
          pastors: resultPastors as Pastor[],
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by gender --> Many
    if (term && searchType === PastorSearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      try {
        if (!validGenders.includes(genderTerm)) {
          throw new BadRequestException(`Género no válido: ${term}`);
        }

        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              gender: genderTerm,
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          const genderInSpanish = GenderNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron pastores(as) con este género: ${genderInSpanish}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by marital status --> Many
    if (term && searchType === PastorSearchType.MaritalStatus) {
      const maritalStatusTerm = term.toLowerCase();
      const validMaritalStatus = [
        'single',
        'married',
        'widowed',
        'divorced',
        'other',
      ];

      try {
        if (!validMaritalStatus.includes(maritalStatusTerm)) {
          throw new BadRequestException(`Estado Civil no válido: ${term}`);
        }

        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              maritalStatus: maritalStatusTerm,
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          const maritalStatusInSpanish =
            MaritalStatusNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron pastores(as) con este estado civil: ${maritalStatusInSpanish}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === PastorSearchType.OriginCountry) {
      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              originCountry: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron pastores(as) con este país de origen: ${term}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by department --> Many
    if (term && searchType === PastorSearchType.Department) {
      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              department: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron pastores(as) con este departamento: ${term}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by province --> Many
    if (term && searchType === PastorSearchType.Province) {
      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              province: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron pastores(as) con esta provincia: ${term}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by district --> Many
    if (term && searchType === PastorSearchType.District) {
      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              district: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron pastores(as) con este distrito: ${term}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === PastorSearchType.UrbanSector) {
      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              urbanSector: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron pastores(as) con este sector urbano: ${term}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by address --> Many
    if (term && searchType === PastorSearchType.Address) {
      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              address: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron pastores(as) con esta dirección: ${term}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by status --> Many
    if (term && searchType === PastorSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      try {
        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            recordStatus: recordStatusTerm,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'zones',
            'familyGroups',
            'member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (pastors.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron pastores(as) con este estado de registro: ${value}`,
          );
        }

        return pastorDataFormatter({ pastors }) as any;
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
      !Object.values(PastorSearchType).includes(searchType as PastorSearchType)
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(PastorSearchTypeNames).join(', ')}`,
      );
    }
  }

  //* UPDATE PASTOR
  async update(
    id: string,
    updatePastorDto: UpdatePastorDto,
    user: User,
  ): Promise<Pastor> {
    const {
      roles,
      recordStatus,
      theirChurch,
      inactivationCategory,
      inactivationReason,
    } = updatePastorDto;

    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar el Pastor.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: id },
      relations: ['theirChurch', 'member'],
    });

    if (!pastor) {
      throw new NotFoundException(`Pastor con id: ${id} no fue encontrado.`);
    }

    if (!roles.some((role) => ['disciple', 'pastor'].includes(role))) {
      throw new BadRequestException(
        `Los roles deben incluir "discípulo" y  "pastor"`,
      );
    }

    if (
      pastor.member.roles.includes(MemberRole.Pastor) &&
      !pastor.member.roles.includes(MemberRole.Disciple) &&
      !pastor.member.roles.includes(MemberRole.Preacher) &&
      !pastor.member.roles.includes(MemberRole.Supervisor) &&
      !pastor.member.roles.includes(MemberRole.Copastor) &&
      !pastor.member.roles.includes(MemberRole.Treasurer) &&
      (roles.includes(MemberRole.Copastor) ||
        roles.includes(MemberRole.Supervisor) ||
        roles.includes(MemberRole.Preacher) ||
        roles.includes(MemberRole.Treasurer) ||
        roles.includes(MemberRole.Disciple))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol inferior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor]`,
      );
    }

    //* Update info about Pastor
    if (
      pastor.member.roles.includes(MemberRole.Pastor) &&
      !pastor.member.roles.includes(MemberRole.Copastor) &&
      !pastor.member.roles.includes(MemberRole.Supervisor) &&
      !pastor.member.roles.includes(MemberRole.Preacher) &&
      !pastor.member.roles.includes(MemberRole.Treasurer) &&
      !pastor.member.roles.includes(MemberRole.Disciple) &&
      roles.includes(MemberRole.Pastor) &&
      !roles.includes(MemberRole.Copastor) &&
      !roles.includes(MemberRole.Supervisor) &&
      !roles.includes(MemberRole.Preacher) &&
      !roles.includes(MemberRole.Treasurer) &&
      !roles.includes(MemberRole.Disciple)
    ) {
      if (
        pastor?.recordStatus === RecordStatus.Active &&
        recordStatus === RecordStatus.Inactive
      ) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //? Update if their Church is different
      if (pastor?.theirChurch?.id !== theirChurch) {
        //* Validate new church
        if (!theirChurch) {
          throw new NotFoundException(
            `Para poder actualizar un Pastor, se le ebe asignar una Iglesia.`,
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

        if (newChurch?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        //* Update and save
        let savedMember: Member;
        try {
          const updatedMember = await this.memberRepository.preload({
            id: pastor.member.id,
            firstName: updatePastorDto.firstName,
            lastName: updatePastorDto.lastName,
            gender: updatePastorDto.gender,
            originCountry: updatePastorDto.originCountry,
            birthDate: updatePastorDto.birthDate,
            maritalStatus: updatePastorDto.maritalStatus,
            numberChildren: +updatePastorDto.numberChildren,
            conversionDate: updatePastorDto.conversionDate,
            email: updatePastorDto.email,
            phoneNumber: updatePastorDto.phoneNumber,
            country: updatePastorDto.country,
            department: updatePastorDto.department,
            province: updatePastorDto.province,
            district: updatePastorDto.district,
            urbanSector: updatePastorDto.urbanSector,
            address: updatePastorDto.address,
            referenceAddress: updatePastorDto.referenceAddress,
            roles: updatePastorDto.roles,
          });

          savedMember = await this.memberRepository.save(updatedMember);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        let savedPastor: Pastor;
        try {
          const updatedPastor = await this.pastorRepository.preload({
            id: pastor.id,
            member: savedMember,
            theirChurch: newChurch,
            updatedAt: new Date(),
            updatedBy: user,
            inactivationCategory:
              recordStatus === RecordStatus.Active
                ? null
                : inactivationCategory,
            inactivationReason:
              recordStatus === RecordStatus.Active ? null : inactivationReason,
            recordStatus: recordStatus,
          });

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
            (copastor) => copastor?.theirPastor?.id === pastor?.id,
          );

          await Promise.all(
            copastorsByPastor.map(async (copastor) => {
              await this.copastorRepository.update(copastor?.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Supervisor
          const supervisorsByPastor = allSupervisors.filter(
            (supervisor) => supervisor?.theirPastor?.id === pastor?.id,
          );

          await Promise.all(
            supervisorsByPastor.map(async (supervisor) => {
              await this.supervisorRepository.update(supervisor?.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Zone
          const zonesByPastor = allZones.filter(
            (zone) => zone?.theirPastor?.id === pastor?.id,
          );

          await Promise.all(
            zonesByPastor.map(async (zone) => {
              await this.zoneRepository.update(zone?.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Preacher
          const preachersByPastor = allPreachers.filter(
            (preacher) => preacher?.theirPastor?.id === pastor?.id,
          );

          await Promise.all(
            preachersByPastor.map(async (preacher) => {
              await this.preacherRepository.update(preacher?.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Family Group
          const familyGroupsByPastor = allFamilyGroups.filter(
            (familyGroup) => familyGroup?.theirPastor?.id === pastor?.id,
          );

          await Promise.all(
            familyGroupsByPastor.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup?.id, {
                theirChurch: newChurch,
              });
            }),
          );

          //* Update and set new relationships in Disciple
          const disciplesByPastor = allDisciples.filter(
            (disciple) => disciple?.theirPastor?.id === pastor?.id,
          );

          await Promise.all(
            disciplesByPastor.map(async (disciple) => {
              await this.discipleRepository.update(disciple?.id, {
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
        try {
          const updatedMember = await this.memberRepository.preload({
            id: pastor.member.id,
            firstName: updatePastorDto.firstName,
            lastName: updatePastorDto.lastName,
            gender: updatePastorDto.gender,
            originCountry: updatePastorDto.originCountry,
            birthDate: updatePastorDto.birthDate,
            maritalStatus: updatePastorDto.maritalStatus,
            numberChildren: +updatePastorDto.numberChildren,
            conversionDate: updatePastorDto.conversionDate,
            email: updatePastorDto.email,
            phoneNumber: updatePastorDto.phoneNumber,
            country: updatePastorDto.country,
            department: updatePastorDto.department,
            province: updatePastorDto.province,
            district: updatePastorDto.district,
            urbanSector: updatePastorDto.urbanSector,
            address: updatePastorDto.address,
            referenceAddress: updatePastorDto.referenceAddress,
            roles: updatePastorDto.roles,
          });

          await this.memberRepository.save(updatedMember);

          const updatedPastor = await this.pastorRepository.preload({
            id: pastor.id,
            member: updatedMember,
            theirChurch: pastor.theirChurch,
            updatedAt: new Date(),
            updatedBy: user,
            inactivationCategory:
              recordStatus === RecordStatus.Active
                ? null
                : inactivationCategory,
            inactivationReason:
              recordStatus === RecordStatus.Active ? null : inactivationReason,
            recordStatus: recordStatus,
          });

          return await this.pastorRepository.save(updatedPastor);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }
  }

  //! DELETE PASTOR
  async remove(
    id: string,
    memberInactivateDto: MemberInactivateDto,
    user: User,
  ): Promise<void> {
    const { inactivationCategory, inactivationReason } = memberInactivateDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const pastor = await this.pastorRepository.findOneBy({ id });

    if (!pastor) {
      throw new NotFoundException(`Pastor con id: ${id} no fue encontrado.`);
    }

    //* Update and set in Inactive on Pastor
    try {
      const updatedPastor = await this.pastorRepository.preload({
        id: pastor.id,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory: inactivationCategory,
        inactivationReason: inactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

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
        (copastor) => copastor?.theirPastor?.id === pastor?.id,
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
        (supervisor) => supervisor?.theirPastor?.id === pastor?.id,
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
        (zone) => zone?.theirPastor?.id === pastor?.id,
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
        (preacher) => preacher?.theirPastor?.id === pastor?.id,
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

      //* Update and set to null relationships in Family Group
      const familyGroupsByPastor = allFamilyGroups.filter(
        (familyGroup) => familyGroup?.theirPastor?.id === pastor?.id,
      );

      await Promise.all(
        familyGroupsByPastor.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup?.id, {
            theirPastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciple
      const disciplesByPastor = allDisciples.filter(
        (disciple) => disciple?.theirPastor?.id === pastor?.id,
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
      }
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
