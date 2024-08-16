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
  MemberRole,
  GenderNames,
  RecordStatus,
  MaritalStatusNames,
} from '@/common/enums';
import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';
import { dateFormatterToDDMMYYY, getBirthDateByMonth } from '@/common/helpers';

import {
  DiscipleSearchType,
  DiscipleSearchSubType,
  DiscipleSearchTypeNames,
} from '@/modules/disciple/enums';
import { discipleDataFormatter } from '@/modules/disciple/helpers';
import { CreateDiscipleDto, UpdateDiscipleDto } from '@/modules/disciple/dto';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';

@Injectable()
export class DiscipleService {
  private readonly logger = new Logger('DiscipleService');

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

  //* CREATE DISCIPLE
  async create(
    createDiscipleDto: CreateDiscipleDto,
    user: User,
  ): Promise<Disciple> {
    const { roles, theirFamilyGroup, numberChildren } = createDiscipleDto;

    if (!roles.includes(MemberRole.Disciple)) {
      throw new BadRequestException(`El rol "Discípulo" debe ser incluido.`);
    }

    if (
      roles.includes(MemberRole.Pastor) ||
      roles.includes(MemberRole.Copastor) ||
      roles.includes(MemberRole.Preacher) ||
      roles.includes(MemberRole.Supervisor) ||
      roles.includes(MemberRole.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Discípulo, solo se requiere el rol: "Discípulo"`,
      );
    }

    //? Validate and assign Family House
    if (!theirFamilyGroup) {
      throw new NotFoundException(
        `Para crear un nuevo Discípulo se le debe asignar un Grupo familiar`,
      );
    }

    const familyGroup = await this.familyGroupRepository.findOne({
      where: { id: theirFamilyGroup },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirZone',
        'theirPreacher',
      ],
    });

    if (!familyGroup) {
      throw new NotFoundException(
        `Grupo familiar con id: ${theirFamilyGroup}, no fue encontrado.`,
      );
    }

    if (!familyGroup?.recordStatus) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Grupo familiar debe ser "Activo".`,
      );
    }

    //* Validate and assign preacher according family house
    if (!familyGroup?.theirPreacher) {
      throw new NotFoundException(
        `Predicador no fue encontrado, verifica que Grupo Familiar tenga un Predicador asignado.`,
      );
    }

    const preacher = await this.preacherRepository.findOne({
      where: { id: familyGroup?.theirPreacher?.id },
    });

    if (!preacher?.recordStatus) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Predicador debe ser "Activo".`,
      );
    }

    //* Validate and assign zone according family house
    if (!familyGroup?.theirZone) {
      throw new NotFoundException(
        `Zona no fue encontrada, verifica que Grupo Familiar tenga una Zona asignada.`,
      );
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: familyGroup?.theirZone?.id },
    });

    if (!zone?.recordStatus) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
      );
    }

    //* Validate and assign supervisor according family house
    if (!familyGroup?.theirSupervisor) {
      throw new NotFoundException(
        `Supervisor no fue encontrado, verifica que Grupo Familiar tenga un Supervisor asignado.`,
      );
    }

    const supervisor = await this.supervisorRepository.findOne({
      where: { id: familyGroup?.theirSupervisor?.id },
    });

    if (!supervisor?.recordStatus) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
      );
    }

    //* Validate and assign copastor according family house
    if (!familyGroup?.theirCopastor) {
      throw new NotFoundException(
        `Co-Pastor no fue encontrado, verifica que Grupo Familiar tenga un Co-Pastor asignado.`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: familyGroup?.theirCopastor?.id },
    });

    if (!copastor?.recordStatus) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
      );
    }

    //* Validate and assign pastor according family house
    if (!familyGroup?.theirPastor) {
      throw new NotFoundException(
        `Pastor no fue encontrado, verifica que Grupo Familiar tenga un Pastor asignado.`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: familyGroup?.theirPastor?.id },
    });

    if (!pastor?.recordStatus) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
      );
    }

    //* Validate and assign church according family house
    if (!familyGroup?.theirChurch) {
      throw new NotFoundException(
        `Iglesia no fue encontrada, verifica que Grupo Familiar tenga una Iglesia asignada.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: familyGroup?.theirChurch?.id },
    });

    if (!church?.recordStatus) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    // Create new instance
    try {
      const newDisciple = this.discipleRepository.create({
        ...createDiscipleDto,
        numberChildren: +numberChildren,
        theirChurch: church,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirSupervisor: supervisor,
        theirZone: zone,
        theirPreacher: preacher,
        theirFamilyGroup: familyGroup,
        createdAt: new Date(),
        createdBy: user,
      });

      return await this.discipleRepository.save(newDisciple);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit, offset = 0, order = 'ASC' } = paginationDto;

    const disciples = await this.discipleRepository.find({
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
        'theirFamilyGroup',
      ],
      order: { createdAt: order as FindOptionsOrderValue },
    });

    return discipleDataFormatter({ disciples }) as any;
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<Disciple | Disciple[]> {
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

    //? Find by first name () --> Many
    //* Disciple by disciple names
    if (
      term &&
      searchType === DiscipleSearchType.FirstName &&
      searchSubType === DiscipleSearchSubType.ByDiscipleNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const disciples = await this.discipleRepository.find({
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
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
          'theirPreacher',
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los nombres: ${firstNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by preacher names
    if (
      term &&
      searchType === DiscipleSearchType.FirstName &&
      searchSubType === DiscipleSearchSubType.DiscipleByPreacherNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const preachers = await this.preacherRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const preachersId = preachers.map((preacher) => preacher?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los nombres de su predicador: ${firstNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by supervisor names
    if (
      term &&
      searchType === DiscipleSearchType.FirstName &&
      searchSubType === DiscipleSearchSubType.DiscipleBySupervisorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const supervisorsId = supervisors.map((supervisor) => supervisor?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los nombres de su supervisor: ${firstNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by co-pastor names
    if (
      term &&
      searchType === DiscipleSearchType.FirstName &&
      searchSubType === DiscipleSearchSubType.DiscipleByCopastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const copastors = await this.copastorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const copastorsId = copastors.map((copastor) => copastor?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los nombres de su co-pastor: ${firstNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by pastor names
    if (
      term &&
      searchType === DiscipleSearchType.FirstName &&
      searchSubType === DiscipleSearchSubType.DiscipleByPastorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const pastors = await this.pastorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const pastorsId = pastors.map((pastor) => pastor?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los nombres de su pastor: ${firstNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by last name --> Many
    //* Disciples by last names
    if (
      term &&
      searchType === DiscipleSearchType.LastName &&
      searchSubType === DiscipleSearchSubType.ByDiscipleLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const disciples = await this.discipleRepository.find({
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
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
          'theirPreacher',
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los apellidos: ${lastNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by preacher last names
    if (
      term &&
      searchType === DiscipleSearchType.LastName &&
      searchSubType === DiscipleSearchSubType.DiscipleByPreacherLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const preachers = await this.preacherRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const preacherId = preachers.map((preacher) => preacher?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los apellidos de su predicador: ${lastNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by supervisor last names
    if (
      term &&
      searchType === DiscipleSearchType.LastName &&
      searchSubType === DiscipleSearchSubType.DiscipleBySupervisorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const supervisorsId = supervisors.map((supervisor) => supervisor?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los apellidos de su supervisor: ${lastNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by co-pastor last names
    if (
      term &&
      searchType === DiscipleSearchType.LastName &&
      searchSubType === DiscipleSearchSubType.DiscipleByCopastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const copastors = await this.copastorRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const copastorsId = copastors.map((copastor) => copastor?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los apellidos de su co-pastor: ${lastNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by pastor last names
    if (
      term &&
      searchType === DiscipleSearchType.LastName &&
      searchSubType === DiscipleSearchSubType.DiscipleByPastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const pastors = await this.pastorRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const pastorsId = pastors.map((pastor) => pastor?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los apellidos de su pastor: ${lastNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by full name --> Many
    //* Disciples by full names
    if (
      term &&
      searchType === DiscipleSearchType.FullName &&
      searchSubType === DiscipleSearchSubType.ByDiscipleFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const disciples = await this.discipleRepository.find({
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
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
          'theirPreacher',
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los nombres y apellidos: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by preacher full names
    if (
      term &&
      searchType === DiscipleSearchType.FullName &&
      searchSubType === DiscipleSearchSubType.DiscipleByPreacherFullName
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

      const preachersId = preachers.map((preacher) => preacher?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los nombres y apellidos de su predicador: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by supervisor full names
    if (
      term &&
      searchType === DiscipleSearchType.FullName &&
      searchSubType === DiscipleSearchSubType.DiscipleBySupervisorFullName
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

      const supervisorsId = supervisors.map((supervisor) => supervisor?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los nombres y apellidos de su supervisor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by co-pastor full names
    if (
      term &&
      searchType === DiscipleSearchType.FullName &&
      searchSubType === DiscipleSearchSubType.DiscipleByCopastorFullName
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

      const copastorsId = copastors.map((copastor) => copastor?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los nombres y apellidos de su co-pastor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Disciples by pastor full names
    if (
      term &&
      searchType === DiscipleSearchType.FullName &&
      searchSubType === DiscipleSearchSubType.DiscipleByPastorFullName
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

      const pastorsId = pastors.map((pastor) => pastor?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos por los nombres y apellidos de su pastor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by birth date --> Many
    if (term && searchType === DiscipleSearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      const disciples = await this.discipleRepository.find({
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
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
          'theirPreacher',
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        const fromDate = dateFormatterToDDMMYYY(fromTimestamp);
        const toDate = dateFormatterToDDMMYYY(toTimestamp);

        throw new NotFoundException(
          `No se encontraron discípulos con este rango de fechas de nacimiento: ${fromDate} - ${toDate}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === DiscipleSearchType.BirthMonth) {
      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const resultDisciples = getBirthDateByMonth({
        month: term,
        data: disciples,
      });

      if (resultDisciples.length === 0) {
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
          `No se encontraron discípulos con este mes de nacimiento: ${monthInSpanish}`,
        );
      }

      try {
        return discipleDataFormatter({
          disciples: resultDisciples as Disciple[],
        }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by family-group-code --> Many
    if (term && searchType === DiscipleSearchType.FamilyGroupCode) {
      const familyGroups = await this.familyGroupRepository.find({
        where: {
          familyGroupCode: ILike(`%${term}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const familyGroupsId = familyGroups.map((familyGroup) => familyGroup?.id);

      const disciples = await this.discipleRepository.find({
        where: {
          theirFamilyGroup: In(familyGroupsId),
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos con este código de grupo familiar: ${term}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by family-group-name --> Many
    if (term && searchType === DiscipleSearchType.FamilyGroupName) {
      const familyGroups = await this.familyGroupRepository.find({
        where: {
          familyGroupName: ILike(`%${term}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const familyGroupsId = familyGroups.map((familyGroup) => familyGroup?.id);

      const disciples = await this.discipleRepository.find({
        where: {
          theirFamilyGroup: In(familyGroupsId),
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos con este nombre de grupo familiar: ${term}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by zone --> Many
    if (term && searchType === DiscipleSearchType.ZoneName) {
      const zones = await this.zoneRepository.find({
        where: {
          zoneName: ILike(`%${term}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const zonesId = zones.map((zone) => zone?.id);

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos con este nombre de zona: ${term}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by gender --> Many
    if (term && searchType === DiscipleSearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      const disciples = await this.discipleRepository.find({
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
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
          'theirPreacher',
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        const genderInSpanish = GenderNames[term.toLowerCase()] ?? term;

        throw new NotFoundException(
          `No se encontraron discípulos con este género: ${genderInSpanish}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by marital status --> Many
    if (term && searchType === DiscipleSearchType.MaritalStatus) {
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

      const disciples = await this.discipleRepository.find({
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
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
          'theirPreacher',
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        const maritalStatusInSpanish =
          MaritalStatusNames[term.toLowerCase()] ?? term;

        throw new NotFoundException(
          `No se encontraron discípulos con este estado civil: ${maritalStatusInSpanish}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === DiscipleSearchType.OriginCountry) {
      const disciples = await this.discipleRepository.find({
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
          'theirCopastor',
          'theirSupervisor',
          'theirZone',
          'theirPreacher',
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos con este país de origen: ${term}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by department --> Many
    if (term && searchType === DiscipleSearchType.Department) {
      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos con este departamento: ${term}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by province --> Many
    if (term && searchType === DiscipleSearchType.Province) {
      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos con esta provincia: ${term}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by district --> Many
    if (term && searchType === DiscipleSearchType.District) {
      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos con este distrito: ${term}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === DiscipleSearchType.UrbanSector) {
      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos con este sector urbano: ${term}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by address --> Many
    if (term && searchType === DiscipleSearchType.Address) {
      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No se encontraron discípulos con esta dirección: ${term}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by status --> Many
    if (term && searchType === DiscipleSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      const disciples = await this.discipleRepository.find({
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
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

        throw new NotFoundException(
          `No se encontraron discípulos con este estado de registro: ${value}`,
        );
      }

      try {
        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //! General Exceptions
    if (
      term &&
      !Object.values(DiscipleSearchType).includes(
        searchType as DiscipleSearchType,
      )
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(DiscipleSearchTypeNames).join(', ')}`,
      );
    }

    if (
      term &&
      (DiscipleSearchType.FirstName ||
        DiscipleSearchType.LastName ||
        DiscipleSearchType.FullName) &&
      !searchSubType
    ) {
      throw new BadRequestException(
        `Para buscar por nombres o apellidos el sub-tipo es requerido.`,
      );
    }
  }

  //* UPDATE DISCIPLE
  async update(
    id: string,
    updateDiscipleDto: UpdateDiscipleDto,
    user: User,
  ): Promise<Disciple | Preacher> {
    const {
      roles,
      recordStatus,
      theirSupervisor,
      theirFamilyGroup,
      numberChildren,
    } = updateDiscipleDto;

    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar el Discípulo.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const disciple = await this.discipleRepository.findOne({
      where: { id: id },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirPreacher',
        'theirZone',
        'theirFamilyGroup',
      ],
    });

    if (!disciple) {
      throw new NotFoundException(`Discípulo con id: ${id} no fue encontrado.`);
    }

    if (!roles.some((role) => ['disciple'].includes(role))) {
      throw new BadRequestException(`Los roles deben incluir "Discípulo"`);
    }

    if (
      (disciple.roles.includes(MemberRole.Disciple) &&
        !disciple.roles.includes(MemberRole.Preacher) &&
        !disciple.roles.includes(MemberRole.Preacher) &&
        !disciple.roles.includes(MemberRole.Copastor) &&
        !disciple.roles.includes(MemberRole.Pastor) &&
        !disciple.roles.includes(MemberRole.Treasurer) &&
        (roles.includes(MemberRole.Copastor) ||
          roles.includes(MemberRole.Pastor) ||
          roles.includes(MemberRole.Supervisor))) ||
      (disciple.roles.includes(MemberRole.Disciple) &&
        disciple.roles.includes(MemberRole.Treasurer) &&
        !disciple.roles.includes(MemberRole.Preacher) &&
        !disciple.roles.includes(MemberRole.Copastor) &&
        !disciple.roles.includes(MemberRole.Pastor) &&
        !disciple.roles.includes(MemberRole.Preacher) &&
        (roles.includes(MemberRole.Copastor) ||
          roles.includes(MemberRole.Pastor) ||
          roles.includes(MemberRole.Supervisor)))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol superior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor].`,
      );
    }

    //* Update info about Disciple
    if (
      disciple.roles.includes(MemberRole.Disciple) &&
      !disciple.roles.includes(MemberRole.Preacher) &&
      !disciple.roles.includes(MemberRole.Pastor) &&
      !disciple.roles.includes(MemberRole.Copastor) &&
      !disciple.roles.includes(MemberRole.Supervisor) &&
      !disciple.roles.includes(MemberRole.Treasurer) &&
      roles.includes(MemberRole.Disciple) &&
      !roles.includes(MemberRole.Preacher) &&
      !roles.includes(MemberRole.Pastor) &&
      !roles.includes(MemberRole.Copastor) &&
      !roles.includes(MemberRole.Supervisor) &&
      !roles.includes(MemberRole.Treasurer)
    ) {
      if (
        disciple?.recordStatus === RecordStatus.Active &&
        recordStatus === RecordStatus.Inactive
      ) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //? Update if their Family House is different
      if (disciple?.theirFamilyGroup?.id !== theirFamilyGroup) {
        //* Validate family house
        if (!theirFamilyGroup) {
          throw new NotFoundException(
            `Para poder actualizar un Discípulo, se debe asignar un Grupo familiar.`,
          );
        }

        const newFamilyGroup = await this.familyGroupRepository.findOne({
          where: { id: theirFamilyGroup },
          relations: [
            'theirChurch',
            'theirPastor',
            'theirCopastor',
            'theirSupervisor',
            'theirPreacher',
            'theirZone',
          ],
        });

        if (!newFamilyGroup) {
          throw new NotFoundException(
            `Grupo familiar con id: ${theirFamilyGroup} no fue encontrado.`,
          );
        }

        if (!newFamilyGroup?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Grupo Familiar debe ser "Activo".`,
          );
        }

        //* Validate Preacher according family house
        if (!newFamilyGroup?.theirPreacher) {
          throw new BadRequestException(
            `No se encontró el Predicador, verifica que Grupo Familiar tenga una Predicador asignado.`,
          );
        }

        const newPreacher = await this.preacherRepository.findOne({
          where: { id: newFamilyGroup?.theirPreacher?.id },
        });

        if (!newPreacher?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Predicador debe ser "Activo".`,
          );
        }

        //* Validate Supervisor according family house
        if (!newFamilyGroup?.theirSupervisor) {
          throw new BadRequestException(
            `No se encontró el Supervisor, verifica que Grupo Familiar tenga una Supervisor asignado.`,
          );
        }

        const newSupervisor = await this.supervisorRepository.findOne({
          where: { id: newFamilyGroup?.theirSupervisor?.id },
        });

        if (!newSupervisor?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
          );
        }

        //* Validate Zone according family house
        if (!newFamilyGroup?.theirZone) {
          throw new BadRequestException(
            `No se encontró la Zona, verifica que Grupo Familiar tenga una Zona asignada.`,
          );
        }

        const newZone = await this.zoneRepository.findOne({
          where: { id: newFamilyGroup?.theirZone?.id },
        });

        if (!newZone?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
          );
        }

        //* Validate Copastor according family house
        if (!newFamilyGroup?.theirCopastor) {
          throw new BadRequestException(
            `No se encontró el Co-Pastor, verifica que Grupo Familiar tenga un Co-Pastor asignado.`,
          );
        }

        const newCopastor = await this.copastorRepository.findOne({
          where: { id: newFamilyGroup?.theirCopastor?.id },
        });

        if (!newCopastor?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
          );
        }

        //* Validate Pastor according family house
        if (!newFamilyGroup?.theirPastor) {
          throw new BadRequestException(
            `No se encontró el Pastor, verifica que Grupo Familiar tenga una Pastor asignado.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newFamilyGroup?.theirPastor?.id },
        });

        if (!newPastor?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
          );
        }

        //* Validate Church according family house
        if (!newFamilyGroup?.theirChurch) {
          throw new BadRequestException(
            `No se encontró la Iglesia, verifica que Grupo Familiar tenga una Iglesia asignada.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newFamilyGroup?.theirChurch?.id },
        });

        if (!newChurch?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        // Update and save
        const updatedDisciple = await this.discipleRepository.preload({
          id: disciple.id,
          ...updateDiscipleDto,
          numberChildren: +numberChildren,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
          theirZone: newZone,
          theirFamilyGroup: newFamilyGroup,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        try {
          return await this.discipleRepository.save(updatedDisciple);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? Update and save if is same Copastor
      if (disciple?.theirFamilyGroup?.id === theirFamilyGroup) {
        const updatedDisciple = await this.discipleRepository.preload({
          id: disciple.id,
          ...updateDiscipleDto,
          numberChildren: +numberChildren,
          theirChurch: disciple.theirChurch,
          theirPastor: disciple.theirPastor,
          theirCopastor: disciple.theirCopastor,
          theirSupervisor: disciple.theirSupervisor,
          theirPreacher: disciple.theirPreacher,
          theirZone: disciple.theirZone,
          theirFamilyGroup: disciple.theirFamilyGroup,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        try {
          return await this.discipleRepository.save(updatedDisciple);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Raise Disciple level to Preacher
    if (
      disciple.roles.includes(MemberRole.Disciple) &&
      !disciple.roles.includes(MemberRole.Preacher) &&
      !disciple.roles.includes(MemberRole.Treasurer) &&
      !disciple.roles.includes(MemberRole.Copastor) &&
      !disciple.roles.includes(MemberRole.Supervisor) &&
      !disciple.roles.includes(MemberRole.Pastor) &&
      roles.includes(MemberRole.Disciple) &&
      roles.includes(MemberRole.Preacher) &&
      !roles.includes(MemberRole.Treasurer) &&
      !roles.includes(MemberRole.Copastor) &&
      !roles.includes(MemberRole.Pastor) &&
      !roles.includes(MemberRole.Supervisor) &&
      recordStatus === RecordStatus.Active
    ) {
      //* Validation new supervisor
      if (!theirSupervisor) {
        throw new NotFoundException(
          `Para subir de nivel de Discípulo a Predicador, se le debe asignar un Supervisor.`,
        );
      }

      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: theirSupervisor },
        relations: ['theirCopastor', 'theirPastor', 'theirChurch', 'theirZone'],
      });

      if (!newSupervisor) {
        throw new NotFoundException(
          `Supervisor con id: ${id} no fue encontrado.`,
        );
      }

      if (newSupervisor?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
        );
      }

      //* Validation new zone according supervisor
      if (!newSupervisor?.theirZone) {
        throw new BadRequestException(
          `No se encontró la Zona, verifica que Supervisor tenga una Zona asignada.`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: newSupervisor?.theirZone?.id },
      });

      if (newZone?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
        );
      }

      //* Validation new copastor according supervisor
      if (!newSupervisor?.theirCopastor) {
        throw new BadRequestException(
          `No se encontró el Co-Pastor, verifica que Supervisor tenga un Co-Pastor asignado.`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newSupervisor?.theirCopastor?.id },
      });

      if (newCopastor?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
        );
      }

      //* Validation new pastor according supervisor
      if (!newSupervisor?.theirPastor) {
        throw new BadRequestException(
          `No se encontró el Pastor, verifica que Supervisor tenga un Pastor asignado.`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newSupervisor?.theirPastor?.id },
      });

      if (newPastor?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
        );
      }

      //* Validation new church according supervisor
      if (!newSupervisor?.theirChurch) {
        throw new BadRequestException(
          `No se encontró la Iglesia, verifica que Supervisor tenga una Iglesia asignada.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newSupervisor?.theirChurch?.id },
      });

      if (newChurch?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }

      // Create new instance Preacher and delete old disciple
      try {
        const newPreacher = this.preacherRepository.create({
          ...updateDiscipleDto,
          numberChildren: +numberChildren,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirZone: newZone,
          theirSupervisor: newSupervisor,
          theirFamilyGroup: null,
          createdAt: new Date(),
          createdBy: user,
        });
        const savedPreacher = await this.preacherRepository.save(newPreacher);

        await this.discipleRepository.remove(disciple);

        return savedPreacher;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    } else {
      throw new BadRequestException(
        `No se puede subir de nivel este registro, el modo debe ser "Activo", y el rol solo debe ser: ["discípulo"], revisar y actualizar el registro.`,
      );
    }
  }

  //! DELETE DISCIPLE
  async remove(id: string, user: User): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const disciple = await this.discipleRepository.findOneBy({ id });

    if (!disciple) {
      throw new NotFoundException(`Discípulo con id: ${id} no fue encontrado.`);
    }

    //* Update and set in Inactive on Preacher
    const updatedDisciple = await this.discipleRepository.preload({
      id: disciple.id,
      theirChurch: null,
      theirPastor: null,
      theirCopastor: null,
      theirSupervisor: null,
      theirZone: null,
      theirFamilyGroup: null,
      theirPreacher: null,
      updatedAt: new Date(),
      updatedBy: user,
      recordStatus: RecordStatus.Inactive,
    });

    // Update and save
    try {
      await this.discipleRepository.save(updatedDisciple);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
  //TODO : revisar cuando se desactiva un discipulo desaparece en su array de las demas relaciones
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
      'Sucedió un error inesperado, revise los registros de consola',
    );
  }
}
