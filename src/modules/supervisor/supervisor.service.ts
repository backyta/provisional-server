import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  In,
  ILike,
  IsNull,
  Between,
  Repository,
  FindOptionsOrderValue,
} from 'typeorm';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';

import {
  CreateSupervisorDto,
  UpdateSupervisorDto,
} from '@/modules/supervisor/dto';
import {
  SupervisorSearchType,
  SupervisorSearchSubType,
  SupervisorSearchTypeNames,
} from '@/modules/supervisor/enums';
import { supervisorDataFormatter } from '@/modules/supervisor/helpers';

import {
  MemberRole,
  GenderNames,
  RecordStatus,
  MaritalStatusNames,
} from '@/common/enums';
import {
  InactivateMemberDto,
  PaginationDto,
  SearchAndPaginationDto,
} from '@/common/dtos';
import { dateFormatterToDDMMYYYY, getBirthDateByMonth } from '@/common/helpers';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Member } from '@/modules/member/entities';
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

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  //* CREATE SUPERVISOR
  async create(
    createSupervisorDto: CreateSupervisorDto,
    user: User,
  ): Promise<Supervisor> {
    const { roles, theirPastor, theirCopastor, isDirectRelationToPastor } =
      createSupervisorDto;

    if (!roles.includes(MemberRole.Supervisor)) {
      throw new BadRequestException(`El rol "Supervisor" deben ser incluidos.`);
    }

    if (
      roles.includes(MemberRole.Pastor) ||
      roles.includes(MemberRole.Copastor) ||
      roles.includes(MemberRole.Preacher) ||
      roles.includes(MemberRole.Disciple)
    ) {
      throw new BadRequestException(
        `Para crear un Supervisor, solo se requiere los roles: "Supervisor" o también "Tesorero."`,
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

      if (copastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
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

      if (pastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
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

      if (church?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en la Iglesia debe ser "Activo"`,
        );
      }

      //* Create new instance member and assign to new supervisor instance
      try {
        const newMember = this.memberRepository.create({
          firstName: createSupervisorDto.firstName,
          lastName: createSupervisorDto.lastName,
          gender: createSupervisorDto.gender,
          originCountry: createSupervisorDto.originCountry,
          birthDate: createSupervisorDto.birthDate,
          maritalStatus: createSupervisorDto.maritalStatus,
          numberChildren: +createSupervisorDto.numberChildren,
          conversionDate: createSupervisorDto.conversionDate,
          email: createSupervisorDto.email,
          phoneNumber: createSupervisorDto.phoneNumber,
          country: createSupervisorDto.country,
          department: createSupervisorDto.department,
          province: createSupervisorDto.province,
          district: createSupervisorDto.district,
          urbanSector: createSupervisorDto.urbanSector,
          address: createSupervisorDto.address,
          referenceAddress: createSupervisorDto.referenceAddress,
          roles: createSupervisorDto.roles,
        });

        await this.memberRepository.save(newMember);

        const newSupervisor = this.supervisorRepository.create({
          member: newMember,
          isDirectRelationToPastor: isDirectRelationToPastor,
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

      if (pastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo"`,
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

      if (pastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
        );
      }

      // Create new instance
      try {
        const newMember = this.memberRepository.create({
          firstName: createSupervisorDto.firstName,
          lastName: createSupervisorDto.lastName,
          gender: createSupervisorDto.gender,
          originCountry: createSupervisorDto.originCountry,
          birthDate: createSupervisorDto.birthDate,
          maritalStatus: createSupervisorDto.maritalStatus,
          numberChildren: +createSupervisorDto.numberChildren,
          conversionDate: createSupervisorDto.conversionDate,
          email: createSupervisorDto.email,
          phoneNumber: createSupervisorDto.phoneNumber,
          country: createSupervisorDto.country,
          department: createSupervisorDto.department,
          province: createSupervisorDto.province,
          district: createSupervisorDto.district,
          urbanSector: createSupervisorDto.urbanSector,
          address: createSupervisorDto.address,
          referenceAddress: createSupervisorDto.referenceAddress,
          roles: createSupervisorDto.roles,
        });

        await this.memberRepository.save(newMember);

        const newSupervisor = this.supervisorRepository.create({
          member: newMember,
          isDirectRelationToPastor: isDirectRelationToPastor,
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
    const {
      limit,
      offset = 0,
      order = 'ASC',
      isNullZone,
      isSimpleQuery,
      churchId,
    } = paginationDto;

    if (isSimpleQuery) {
      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            recordStatus: RecordStatus.Active,
            theirZone: isNullZone ? IsNull() : null,
          },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: ['member'],
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return supervisors;
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

      const supervisors = await this.supervisorRepository.find({
        where: {
          theirChurch: church,
          recordStatus: RecordStatus.Active,
          theirZone: isNullZone ? IsNull() : null,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'member',
          'theirChurch',
          'theirPastor.member',
          'theirCopastor.member',
          'familyGroups',
          'theirZone',
          'preachers.member',
          'disciples.member',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return supervisorDataFormatter({ supervisors }) as any;
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
  ): Promise<Supervisor[]> {
    const {
      'search-type': searchType,
      'search-sub-type': searchSubType,
      limit,
      offset = 0,
      order,
      isNullZone = 'false',
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
    //* Supervisors by supervisor names
    if (
      term &&
      searchType === SupervisorSearchType.FirstName &&
      searchSubType === SupervisorSearchSubType.BySupervisorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con estos nombres: ${firstNames}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by co-pastor names
    if (
      term &&
      searchType === SupervisorSearchType.FirstName &&
      searchSubType === SupervisorSearchSubType.SupervisorByCopastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            member: {
              firstName: ILike(`%${firstNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastorsId = copastors.map((copastor) => copastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirCopastor: In(copastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) por los nombres de su co-pastor: ${firstNames}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by pastor names
    if (
      term &&
      searchType === SupervisorSearchType.FirstName &&
      searchSubType === SupervisorSearchSubType.SupervisorByPastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            member: {
              firstName: ILike(`%${firstNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const pastorsId = pastors.map((pastor) => pastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirPastor: In(pastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) por los nombres de su pastor: ${firstNames}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by last name --> Many
    //* Supervisors by last names
    if (
      term &&
      searchType === SupervisorSearchType.LastName &&
      searchSubType === SupervisorSearchSubType.BySupervisorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con estos apellidos: ${lastNames}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by co-pastor last names
    if (
      term &&
      searchType === SupervisorSearchType.LastName &&
      searchSubType === SupervisorSearchSubType.SupervisorByCopastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            member: {
              lastName: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastorsId = copastors.map((copastor) => copastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirCopastor: In(copastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) por los apellidos de su co-pastor: ${lastNames}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by pastor last names
    if (
      term &&
      searchType === SupervisorSearchType.LastName &&
      searchSubType === SupervisorSearchSubType.SupervisorByPastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            member: {
              lastName: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const pastorsId = pastors.map((pastor) => pastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirPastor: In(pastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) por los apellidos de su pastor: ${lastNames}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by full name --> Many
    //* Supervisors by full names
    if (
      term &&
      searchType === SupervisorSearchType.FullName &&
      searchSubType === SupervisorSearchSubType.BySupervisorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con estos nombres y apellidos: ${firstNames} ${lastNames}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by co-pastor full names
    if (
      term &&
      searchType === SupervisorSearchType.FullName &&
      searchSubType === SupervisorSearchSubType.SupervisorByCopastorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            member: {
              firstName: ILike(`%${firstNames}%`),
              lastName: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastorsId = copastors.map((copastor) => copastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirCopastor: In(copastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) por los nombres y apellidos de su co-pastor: ${firstNames} ${lastNames}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by pastor full names
    if (
      term &&
      searchType === SupervisorSearchType.FullName &&
      searchSubType === SupervisorSearchSubType.SupervisorByPastorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            member: {
              firstName: ILike(`%${firstNames}%`),
              lastName: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const pastorsId = pastors.map((pastor) => pastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirPastor: In(pastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) por los nombres y apellidos de su pastor: ${firstNames} ${lastNames}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by birth date --> Many
    if (term && searchType === SupervisorSearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      try {
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron supervisores(as) con este rango de fechas de nacimiento: ${fromDate} - ${toDate}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === SupervisorSearchType.BirthMonth) {
      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const resultSupervisors = getBirthDateByMonth({
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

        return supervisorDataFormatter({
          supervisors: resultSupervisors as Supervisor[],
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by zone name --> Many
    if (term && searchType === SupervisorSearchType.ZoneName) {
      try {
        const zones = await this.zoneRepository.find({
          where: {
            zoneName: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const zonesId = zones.map((zone) => zone?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirZone: In(zonesId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con este nombre de zona: ${term}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by gender --> Many
    if (term && searchType === SupervisorSearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      try {
        if (!validGenders.includes(genderTerm)) {
          throw new BadRequestException(`Género no válido: ${term}`);
        }

        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          const genderInSpanish = GenderNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron supervisores(as) con este género: ${genderInSpanish}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by marital status --> Many
    if (term && searchType === SupervisorSearchType.MaritalStatus) {
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

        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          const maritalStatusInSpanish =
            MaritalStatusNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron supervisores(as) con este estado civil: ${maritalStatusInSpanish}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === SupervisorSearchType.OriginCountry) {
      try {
        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con este país de origen: ${term}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by department --> Many
    if (term && searchType === SupervisorSearchType.Department) {
      try {
        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con este departamento: ${term}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by province --> Many
    if (term && searchType === SupervisorSearchType.Province) {
      try {
        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervises(as) con esta provincia: ${term}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by district --> Many
    if (term && searchType === SupervisorSearchType.District) {
      try {
        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con este distrito: ${term}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === SupervisorSearchType.UrbanSector) {
      try {
        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con este sector urbano: ${term}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by address --> Many
    if (term && searchType === SupervisorSearchType.Address) {
      try {
        const supervisors = await this.supervisorRepository.find({
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
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con esta dirección: ${term}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by status --> Many
    if (term && searchType === SupervisorSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      try {
        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            recordStatus: recordStatusTerm,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron supervisores(as) con este estado de registro: ${value}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by copastor id --> Many
    if (term && searchType === SupervisorSearchType.CopastorId) {
      try {
        const copastor = await this.copastorRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirCopastor: copastor,
            theirZone: isNullZone ? IsNull() : null,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: ['member', 'theirZone'],
        });

        return supervisors;
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
      !Object.values(SupervisorSearchType).includes(
        searchType as SupervisorSearchType,
      )
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(SupervisorSearchTypeNames).join(', ')}`,
      );
    }

    if (
      term &&
      (SupervisorSearchType.FirstName ||
        SupervisorSearchType.LastName ||
        SupervisorSearchType.FullName) &&
      !searchSubType
    ) {
      throw new BadRequestException(
        `Para buscar por nombres o apellidos el sub-tipo es requerido.`,
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
      recordStatus,
      theirPastor,
      theirCopastor,
      isDirectRelationToPastor,
      memberInactivationReason,
      memberInactivationCategory,
    } = updateSupervisorDto;

    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar el Supervisor.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    //* Validation supervisor
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: id },
      relations: ['theirCopastor', 'theirPastor', 'theirChurch', 'member'],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Supervisor con id: ${id} no fue encontrado.`,
      );
    }

    if (!roles.some((role) => ['supervisor', 'copastor'].includes(role))) {
      throw new BadRequestException(
        `Los roles deben incluir "Supervisor" o "Co-Pastor".`,
      );
    }

    if (
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        !supervisor.member.roles.includes(MemberRole.Treasurer) &&
        (roles.includes(MemberRole.Pastor) ||
          roles.includes(MemberRole.Preacher) ||
          roles.includes(MemberRole.Disciple))) ||
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        supervisor.member.roles.includes(MemberRole.Treasurer) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        (roles.includes(MemberRole.Pastor) ||
          roles.includes(MemberRole.Preacher) ||
          roles.includes(MemberRole.Disciple)))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol inferior o superior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor].`,
      );
    }

    //* Update info about Supervisor
    if (
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Treasurer) &&
        roles.includes(MemberRole.Supervisor) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Preacher) &&
        !roles.includes(MemberRole.Treasurer)) ||
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        supervisor.member.roles.includes(MemberRole.Treasurer) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        roles.includes(MemberRole.Supervisor) &&
        roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Preacher)) ||
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Treasurer) &&
        roles.includes(MemberRole.Supervisor) &&
        roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Preacher)) ||
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        supervisor.member.roles.includes(MemberRole.Treasurer) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        roles.includes(MemberRole.Supervisor) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Preacher))
    ) {
      if (
        supervisor?.recordStatus === RecordStatus.Active &&
        recordStatus === RecordStatus.Inactive
      ) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //? Update if their Copastor is different and id direct relation to pastor is false (means require copastor)
      if (
        supervisor?.theirCopastor?.id !== theirCopastor &&
        !isDirectRelationToPastor
      ) {
        //* Validate copastor
        if (!theirCopastor) {
          throw new NotFoundException(
            `Para poder actualizar un Supervisor, se le debe asignar un Co-Pastor.`,
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

        if (newCopastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
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

        if (newPastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
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

        if (newChurch?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        //* Update and save
        let savedMember: Member;
        try {
          const updatedMember = await this.memberRepository.preload({
            id: supervisor.member.id,
            firstName: updateSupervisorDto.firstName,
            lastName: updateSupervisorDto.lastName,
            gender: updateSupervisorDto.gender,
            originCountry: updateSupervisorDto.originCountry,
            birthDate: updateSupervisorDto.birthDate,
            maritalStatus: updateSupervisorDto.maritalStatus,
            numberChildren: +updateSupervisorDto.numberChildren,
            conversionDate: updateSupervisorDto.conversionDate,
            email: updateSupervisorDto.email,
            phoneNumber: updateSupervisorDto.phoneNumber,
            country: updateSupervisorDto.country,
            department: updateSupervisorDto.department,
            province: updateSupervisorDto.province,
            district: updateSupervisorDto.district,
            urbanSector: updateSupervisorDto.urbanSector,
            address: updateSupervisorDto.address,
            referenceAddress: updateSupervisorDto.referenceAddress,
            roles: updateSupervisorDto.roles,
          });

          savedMember = await this.memberRepository.save(updatedMember);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        let savedSupervisor: Supervisor;
        try {
          const updatedSupervisor = await this.supervisorRepository.preload({
            id: supervisor.id,
            member: savedMember,
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: newCopastor,
            isDirectRelationToPastor: isDirectRelationToPastor,
            updatedAt: new Date(),
            updatedBy: user,
            inactivationCategory:
              recordStatus === RecordStatus.Active
                ? null
                : memberInactivationCategory,
            inactivationReason:
              recordStatus === RecordStatus.Active
                ? null
                : memberInactivationReason,
            recordStatus: recordStatus,
          });

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
            (zone) => zone?.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            zonesBySupervisor.map(async (zone) => {
              await this.zoneRepository.update(zone?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
              });
            }),
          );

          //* Update and set new relationships in Preacher
          const preachersBySupervisor = allPreachers.filter(
            (preacher) => preacher?.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            preachersBySupervisor.map(async (preacher) => {
              await this.preacherRepository.update(preacher?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
              });
            }),
          );

          //* Update and set new relationships in Family Group
          const familyGroupsBySupervisor = allFamilyGroups.filter(
            (familyGroup) =>
              familyGroup?.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            familyGroupsBySupervisor.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
              });
            }),
          );

          //* Update and set new relationships in Disciple
          const disciplesBySupervisor = allDisciples.filter(
            (disciple) => disciple?.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            disciplesBySupervisor.map(async (disciple) => {
              await this.discipleRepository.update(disciple?.id, {
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

      //! Update if Is Direction relation to pastor is true and different theirPastor
      if (
        supervisor?.theirPastor?.id !== theirPastor &&
        isDirectRelationToPastor
      ) {
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

        if (newPastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
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

        if (newChurch?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        //* Update and save
        let savedMember: Member;
        try {
          const updatedMember = await this.memberRepository.preload({
            id: supervisor.member.id,
            firstName: updateSupervisorDto.firstName,
            lastName: updateSupervisorDto.lastName,
            gender: updateSupervisorDto.gender,
            originCountry: updateSupervisorDto.originCountry,
            birthDate: updateSupervisorDto.birthDate,
            maritalStatus: updateSupervisorDto.maritalStatus,
            numberChildren: +updateSupervisorDto.numberChildren,
            conversionDate: updateSupervisorDto.conversionDate,
            email: updateSupervisorDto.email,
            phoneNumber: updateSupervisorDto.phoneNumber,
            country: updateSupervisorDto.country,
            department: updateSupervisorDto.department,
            province: updateSupervisorDto.province,
            district: updateSupervisorDto.district,
            urbanSector: updateSupervisorDto.urbanSector,
            address: updateSupervisorDto.address,
            referenceAddress: updateSupervisorDto.referenceAddress,
            roles: updateSupervisorDto.roles,
          });

          savedMember = await this.memberRepository.save(updatedMember);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        let savedSupervisor: Supervisor;
        try {
          const updatedSupervisor = await this.supervisorRepository.preload({
            id: supervisor.id,
            member: savedMember,
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: null,
            isDirectRelationToPastor: isDirectRelationToPastor,
            updatedAt: new Date(),
            updatedBy: user,
            inactivationCategory:
              recordStatus === RecordStatus.Active
                ? null
                : memberInactivationCategory,
            inactivationReason:
              recordStatus === RecordStatus.Active
                ? null
                : memberInactivationReason,
            recordStatus: recordStatus,
          });

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
            (zone) => zone?.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            zonesBySupervisor.map(async (zone) => {
              await this.zoneRepository.update(zone?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: null,
              });
            }),
          );

          //* Update and set mew relationships and null copastor in Preacher
          const preachersBySupervisor = allPreachers.filter(
            (preacher) => preacher?.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            preachersBySupervisor.map(async (preacher) => {
              await this.preacherRepository.update(preacher?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: null,
              });
            }),
          );

          //* Update and set mew relationships and null copastor in Family Group
          const familyGroupsBySupervisor = allFamilyGroups.filter(
            (familyGroup) =>
              familyGroup?.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            familyGroupsBySupervisor.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: null,
              });
            }),
          );

          //* Update and set mew relationships and null copastor in Disciple
          const disciplesBySupervisor = allDisciples.filter(
            (disciple) => disciple?.theirSupervisor?.id === supervisor?.id,
          );

          await Promise.all(
            disciplesBySupervisor.map(async (disciple) => {
              await this.discipleRepository.update(disciple?.id, {
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
        supervisor?.theirCopastor?.id === theirCopastor &&
        !isDirectRelationToPastor
      ) {
        try {
          const updatedMember = await this.memberRepository.preload({
            id: supervisor.member.id,
            firstName: updateSupervisorDto.firstName,
            lastName: updateSupervisorDto.lastName,
            gender: updateSupervisorDto.gender,
            originCountry: updateSupervisorDto.originCountry,
            birthDate: updateSupervisorDto.birthDate,
            maritalStatus: updateSupervisorDto.maritalStatus,
            numberChildren: +updateSupervisorDto.numberChildren,
            conversionDate: updateSupervisorDto.conversionDate,
            email: updateSupervisorDto.email,
            phoneNumber: updateSupervisorDto.phoneNumber,
            country: updateSupervisorDto.country,
            department: updateSupervisorDto.department,
            province: updateSupervisorDto.province,
            district: updateSupervisorDto.district,
            urbanSector: updateSupervisorDto.urbanSector,
            address: updateSupervisorDto.address,
            referenceAddress: updateSupervisorDto.referenceAddress,
            roles: updateSupervisorDto.roles,
          });

          await this.memberRepository.save(updatedMember);

          const updatedSupervisor = await this.supervisorRepository.preload({
            id: supervisor.id,
            member: updatedMember,
            theirChurch: supervisor.theirChurch,
            theirPastor: supervisor.theirPastor,
            theirCopastor: supervisor.theirCopastor,
            isDirectRelationToPastor: isDirectRelationToPastor,
            updatedAt: new Date(),
            updatedBy: user,
            inactivationCategory:
              recordStatus === RecordStatus.Active
                ? null
                : memberInactivationCategory,
            inactivationReason:
              recordStatus === RecordStatus.Active
                ? null
                : memberInactivationReason,
            recordStatus: recordStatus,
          });

          return await this.supervisorRepository.save(updatedSupervisor);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? Update and save if is same Pastor (isDirect true)
      if (
        supervisor?.theirPastor?.id === theirPastor &&
        isDirectRelationToPastor
      ) {
        try {
          const updatedMember = await this.memberRepository.preload({
            id: supervisor.member.id,
            firstName: updateSupervisorDto.firstName,
            lastName: updateSupervisorDto.lastName,
            gender: updateSupervisorDto.gender,
            originCountry: updateSupervisorDto.originCountry,
            birthDate: updateSupervisorDto.birthDate,
            maritalStatus: updateSupervisorDto.maritalStatus,
            numberChildren: +updateSupervisorDto.numberChildren,
            conversionDate: updateSupervisorDto.conversionDate,
            email: updateSupervisorDto.email,
            phoneNumber: updateSupervisorDto.phoneNumber,
            country: updateSupervisorDto.country,
            department: updateSupervisorDto.department,
            province: updateSupervisorDto.province,
            district: updateSupervisorDto.district,
            urbanSector: updateSupervisorDto.urbanSector,
            address: updateSupervisorDto.address,
            referenceAddress: updateSupervisorDto.referenceAddress,
            roles: updateSupervisorDto.roles,
          });

          await this.memberRepository.save(updatedMember);

          const updatedSupervisor = await this.supervisorRepository.preload({
            id: supervisor.id,
            member: updatedMember,
            theirChurch: supervisor.theirChurch,
            theirPastor: supervisor.theirPastor,
            theirCopastor: null,
            isDirectRelationToPastor: isDirectRelationToPastor,
            updatedAt: new Date(),
            updatedBy: user,
            inactivationCategory:
              recordStatus === RecordStatus.Active
                ? null
                : memberInactivationCategory,
            inactivationReason:
              recordStatus === RecordStatus.Active
                ? null
                : memberInactivationReason,
            recordStatus: recordStatus,
          });

          return await this.supervisorRepository.save(updatedSupervisor);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Raise Supervisor level to Co-pastor
    if (
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Treasurer) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Supervisor) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Preacher) &&
        recordStatus === RecordStatus.Active) ||
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        supervisor.member.roles.includes(MemberRole.Treasurer) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Supervisor) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Preacher) &&
        recordStatus === RecordStatus.Active)
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

      if (newPastor?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
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

      if (newChurch?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }

      //* Create new instance Copastor and delete old Supervisor
      try {
        const updatedMember = await this.memberRepository.preload({
          id: supervisor.member.id,
          firstName: updateSupervisorDto.firstName,
          lastName: updateSupervisorDto.lastName,
          gender: updateSupervisorDto.gender,
          originCountry: updateSupervisorDto.originCountry,
          birthDate: updateSupervisorDto.birthDate,
          maritalStatus: updateSupervisorDto.maritalStatus,
          numberChildren: +updateSupervisorDto.numberChildren,
          conversionDate: updateSupervisorDto.conversionDate,
          email: updateSupervisorDto.email,
          phoneNumber: updateSupervisorDto.phoneNumber,
          country: updateSupervisorDto.country,
          department: updateSupervisorDto.department,
          province: updateSupervisorDto.province,
          district: updateSupervisorDto.district,
          urbanSector: updateSupervisorDto.urbanSector,
          address: updateSupervisorDto.address,
          referenceAddress: updateSupervisorDto.referenceAddress,
          roles: updateSupervisorDto.roles,
        });

        await this.memberRepository.save(updatedMember);

        const newCopastor = this.copastorRepository.create({
          member: updatedMember,
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
        `No se puede subir de nivel este Supervisor, el modo debe ser "Activo", el rol debe ser: ["supervisor"], revisar y actualizar el registro.`,
      );
    }
  }

  //! INACTIVATE SUPERVISOR
  async remove(
    id: string,
    inactivateMemberDto: InactivateMemberDto,
    user: User,
  ): Promise<void> {
    const { memberInactivationCategory, memberInactivationReason } =
      inactivateMemberDto;

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
    try {
      const updatedSupervisor = await this.supervisorRepository.preload({
        id: supervisor.id,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory: memberInactivationCategory,
        inactivationReason: memberInactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

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
        (zone) => zone?.theirSupervisor?.id === supervisor?.id,
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
        (preacher) => preacher?.theirSupervisor?.id === supervisor?.id,
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

      //* Update and set to null relationships in Family Group
      const familyGroupsBySupervisor = allFamilyGroup.filter(
        (familyGroup) => familyGroup?.theirSupervisor?.id === supervisor?.id,
      );

      await Promise.all(
        familyGroupsBySupervisor.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup?.id, {
            theirSupervisor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciple
      const disciplesBySupervisor = allDisciples.filter(
        (disciple) => disciple?.theirSupervisor?.id === supervisor?.id,
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
      }
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
