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

import { PaginationDto, SearchTypeAndPaginationDto } from '@/common/dtos';
import { MemberRoles, SearchSubType, SearchType, Status } from '@/common/enums';

import { Preacher } from '@/modules/preacher/entities';
import { formatDataPreacher } from '@/modules/preacher/helpers';
import { CreatePreacherDto, UpdatePreacherDto } from '@/modules/preacher/dto';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities/';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';
import { formatToDDMMYYYY, getBirthdaysByMonth } from '@/common/helpers';

@Injectable()
export class PreacherService {
  private readonly logger = new Logger('PreacherService');

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

  //* CREATE PREACHER
  async create(
    createPreacherDto: CreatePreacherDto,
    user: User,
  ): Promise<Preacher> {
    const { roles, theirSupervisor, numberChildren } = createPreacherDto;

    // Validations
    if (
      !roles.includes(MemberRoles.Disciple) &&
      !roles.includes(MemberRoles.Preacher)
    ) {
      throw new BadRequestException(
        `El rol "Discípulo" y "Predicador" deben ser incluidos.`,
      );
    }

    if (
      roles.includes(MemberRoles.Pastor) ||
      roles.includes(MemberRoles.Copastor) ||
      roles.includes(MemberRoles.Supervisor)
    ) {
      throw new BadRequestException(
        `Para crear un Co-Pastor, solo se requiere los roles: "Discípulo" y "Predicador" o también "Tesorero."`,
      );
    }

    if (!theirSupervisor) {
      throw new NotFoundException(
        `Para crear un nuevo Predicador se debe asigna un Supervisor.`,
      );
    }

    //* Validate and assign supervisor
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: theirSupervisor },
      relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Supervisor con id: ${theirSupervisor} no fue encontrado.`,
      );
    }

    if (supervisor.status === Status.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado" en Supervisor debe ser "Activo".`,
      );
    }

    //* Validate and assign zone according supervisor
    if (!supervisor?.theirZone) {
      throw new NotFoundException(
        `Zona no fue encontrada, verifica que Supervisor tenga una Zona asignada.`,
      );
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: supervisor?.theirZone?.id },
    });

    if (zone.status === Status.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado" en Zona debe ser "Activo".`,
      );
    }

    //* Validate and assign copastor according supervisor
    if (!supervisor?.theirCopastor) {
      throw new NotFoundException(
        `Co-Pastor no fue encontrado, verifica que Supervisor tenga un Co-Pastor asignado.`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: supervisor?.theirCopastor?.id },
    });

    if (copastor.status === Status.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado" en Co-Pastor debe ser "Activo".`,
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

    if (pastor.status === Status.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado" en Pastor debe ser "Activo".`,
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

    if (church.status === Status.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado" en Iglesia debe ser "Activo".`,
      );
    }

    // Create new instance
    try {
      const newPreacher = this.preacherRepository.create({
        ...createPreacherDto,
        numberChildren: +numberChildren,
        theirChurch: church,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirSupervisor: supervisor,
        theirZone: zone,
        createdAt: new Date(),
        createdBy: user,
      });

      return await this.preacherRepository.save(newPreacher);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // TODO : ver el backend y redicir la entrega de datos incesarios en las consuiltas
  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit = 10, offset = 0, order = 'ASC' } = paginationDto;

    const preachers = await this.preacherRepository.find({
      where: { status: Status.Active },
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
        'theirFamilyGroup',
        'disciples',
      ],
      relationLoadStrategy: 'query',
      order: { createdAt: order as FindOptionsOrderValue },
    });

    return formatDataPreacher({ preachers }) as any;
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchTypeAndPaginationDto,
  ): Promise<Preacher | Preacher[]> {
    const {
      'search-type': searchType,
      'search-sub-type': searchSubType,
      limit = 10,
      offset = 0,
      order,
    } = searchTypeAndPaginationDto;

    //? Find by first name () --> Many
    //* Preacher by preacher names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.ByPreacherNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con estos nombres: ${firstNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Preachers by supervisor names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.PreacherBySupervisorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const supervisorsId = supervisors.map((supervisor) => supervisor.id);

      const preachers = await this.preacherRepository.find({
        where: {
          theirSupervisor: In(supervisorsId),
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) por los nombres de su supervisor: ${firstNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Preachers by co-pastor names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.PreacherByCopastorNames
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

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) por los nombres de su co-pastor: ${firstNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Preachers by pastor names
    if (
      term &&
      searchType === SearchType.FirstName &&
      searchSubType === SearchSubType.PreacherByPastorNames
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

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) por los nombres de su pastor: ${firstNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by last name --> Many
    //* Preachers by last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.ByPreacherLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con estos apellidos: ${lastNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Preachers by supervisor last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.PreacherBySupervisorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const supervisorsId = supervisors.map((supervisor) => supervisor.id);

      const preachers = await this.preacherRepository.find({
        where: {
          theirSupervisor: In(supervisorsId),
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) por los apellidos de su supervisor: ${lastNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Preachers by co-pastor last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.PreacherByCopastorLastNames
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

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) por los apellidos de su co-pastor: ${lastNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Preachers by pastor last names
    if (
      term &&
      searchType === SearchType.LastName &&
      searchSubType === SearchSubType.PreacherByPastorLastNames
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

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) por los apellidos de su pastor: ${lastNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by full name --> Many
    //* Preachers by full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.ByPreacherFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con estos nombres y apellidos: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Preachers by supervisor full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.PreacherBySupervisorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          lastName: ILike(`%${lastNames}%`),
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const supervisorsId = supervisors.map((supervisor) => supervisor.id);

      const preachers = await this.preacherRepository.find({
        where: {
          theirSupervisor: In(supervisorsId),
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) por los nombres y apellidos de su supervisor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Preachers by co-pastor full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.PreacherByCopastorFullName
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

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) por los nombres y apellidos de su co-pastor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* Preachers by pastor full names
    if (
      term &&
      searchType === SearchType.FullName &&
      searchSubType === SearchSubType.PreacherByPastorFullName
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

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) por los nombres y apellidos de su pastor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
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

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        const fromDate = formatToDDMMYYYY(fromTimestamp);
        const toDate = formatToDDMMYYYY(toTimestamp);

        throw new NotFoundException(
          `No se encontraron predicadores(as) con este rango de fechas de nacimiento: ${fromDate} - ${toDate}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === SearchType.BirthMonth) {
      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const resultPreachers = getBirthdaysByMonth({
        month: term,
        data: preachers,
      });

      if (resultPreachers.length === 0) {
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
          `No se encontraron predicadores(as) con este mes de nacimiento: ${monthInSpanish}`,
        );
      }

      try {
        return formatDataPreacher({
          preachers: resultPreachers as Preacher[],
        }) as any;
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
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const familyGroupsId = familyGroups.map((familyGroup) => familyGroup.id);

      const preachers = await this.preacherRepository.find({
        where: {
          theirFamilyGroup: In(familyGroupsId),
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con este código de grupo familiar: ${term}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
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
          status: Status.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const familyGroupsId = familyGroups.map((familyGroup) => familyGroup.id);

      const preachers = await this.preacherRepository.find({
        where: {
          theirFamilyGroup: In(familyGroupsId),
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con este nombre de grupo familiar: ${term}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
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

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con esta zona: ${term}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
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

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        const genderNames = {
          male: 'Masculino',
          female: 'Femenino',
        };

        const genderInSpanish = genderNames[term.toLowerCase()] ?? term;

        throw new NotFoundException(
          `No se encontraron predicadores(as) con este genero: ${genderInSpanish}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
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

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
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
          `No se encontraron predicadores(as) con este estado civil: ${maritalStatusInSpanish}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === SearchType.OriginCountry) {
      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con este país de origen: ${term}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by department --> Many
    if (term && searchType === SearchType.Department) {
      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con este departamento: ${term}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by province --> Many
    if (term && searchType === SearchType.Province) {
      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con esta provincia: ${term}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by district --> Many
    if (term && searchType === SearchType.District) {
      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con este distrito: ${term}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === SearchType.UrbanSector) {
      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con este sector urbano: ${term}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Find by address --> Many
    if (term && searchType === SearchType.Address) {
      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No se encontraron predicadores(as) con esta dirección: ${term}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
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

      const preachers = await this.preacherRepository.find({
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
          'theirSupervisor',
          'theirZone',
          'theirFamilyGroup',
          'disciples',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        const value = term === 'inactive' ? 'Inactivo' : 'Activo';

        throw new NotFoundException(
          `No se encontraron predicadores(as) con este estado: ${value}`,
        );
      }

      try {
        return formatDataPreacher({ preachers }) as any;
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

  //* UPDATE PREACHER
  async update(
    id: string,
    updatePreacherDto: UpdatePreacherDto,
    user: User,
  ): Promise<Preacher | Supervisor> {
    const {
      roles,
      status,
      theirSupervisor,
      theirCopastor,
      theirPastor,
      numberChildren,
      isDirectRelationToPastor,
    } = updatePreacherDto;

    // Validations
    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar el Predicador.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    // Validation preacher
    const preacher = await this.preacherRepository.findOne({
      where: { id: id },
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
        `Predicador con id: ${id} no fue encontrado.`,
      );
    }

    if (!roles.some((role) => ['disciple', 'preacher'].includes(role))) {
      throw new BadRequestException(
        `Los roles deben incluir "Discípulo" y "Predicador".`,
      );
    }

    if (
      (preacher.roles.includes(MemberRoles.Preacher) &&
        preacher.roles.includes(MemberRoles.Disciple) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        !preacher.roles.includes(MemberRoles.Treasurer) &&
        (roles.includes(MemberRoles.Copastor) ||
          roles.includes(MemberRoles.Pastor))) ||
      (preacher.roles.includes(MemberRoles.Preacher) &&
        preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Treasurer) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        (roles.includes(MemberRoles.Copastor) ||
          roles.includes(MemberRoles.Pastor)))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol inferior o superior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor].`,
      );
    }

    //* Update info about Preacher
    if (
      (preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Preacher) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Treasurer) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Preacher) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Supervisor) &&
        !roles.includes(MemberRoles.Treasurer)) ||
      (preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Preacher) &&
        preacher.roles.includes(MemberRoles.Treasurer) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Preacher) &&
        roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Supervisor)) ||
      (preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Preacher) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Treasurer) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Preacher) &&
        roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Supervisor)) ||
      (preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Preacher) &&
        preacher.roles.includes(MemberRoles.Treasurer) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Preacher) &&
        !roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Supervisor))
    ) {
      // Validations
      if (preacher.status === Status.Active && status === Status.Inactive) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //? Update if their Supervisor is different
      if (preacher.theirSupervisor?.id !== theirSupervisor) {
        //* Validate supervisor
        if (!theirSupervisor) {
          throw new NotFoundException(
            `Para poder actualizar un Predicador, se debe asignar un Supervisor.`,
          );
        }

        const newSupervisor = await this.supervisorRepository.findOne({
          where: { id: theirSupervisor },
          relations: [
            'theirChurch',
            'theirPastor',
            'theirCopastor',
            'theirZone',
          ],
        });

        if (!newSupervisor) {
          throw new NotFoundException(
            `Supervisor con id: ${theirSupervisor} no fue encontrado.`,
          );
        }

        if (newSupervisor.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado" en Supervisor debe ser "Activo".`,
          );
        }

        //* Validate Zone according supervisor
        if (!newSupervisor?.theirZone) {
          throw new BadRequestException(
            `No se encontró la Zona, verifica que Supervisor tenga una Zona asignada.`,
          );
        }

        const newZone = await this.zoneRepository.findOne({
          where: { id: newSupervisor?.theirZone?.id },
        });

        if (newZone.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado" en Zona debe ser "Activo".`,
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

        if (newCopastor.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado" en Co-Pastor debe ser "Activo".`,
          );
        }

        //* Validate Pastor according copastor
        if (!newSupervisor?.theirPastor) {
          throw new BadRequestException(
            `No se encontró el Pastor, verifica que Supervisor tenga un Pastor asignado.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newSupervisor?.theirPastor?.id },
        });

        if (newPastor.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado" en Pastor debe ser "Activo".`,
          );
        }

        //* Validate Church according copastor
        if (!newSupervisor?.theirChurch) {
          throw new BadRequestException(
            `No se encontró la Iglesia, verifica que Supervisor tenga una Iglesia asignada.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newSupervisor?.theirChurch?.id },
        });

        if (newChurch.status === Status.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado" en Iglesia debe ser "Activo".`,
          );
        }

        // Update and save
        const updatedPreacher = await this.preacherRepository.preload({
          id: preacher.id,
          ...updatePreacherDto,
          numberChildren: +numberChildren,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
          theirZone: newZone,
          theirFamilyGroup: preacher.theirFamilyGroup,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        let savedPreacher: Preacher;
        try {
          savedPreacher = await this.preacherRepository.save(updatedPreacher);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //? Update in subordinate relations
        const allFamilyGroups = await this.familyGroupRepository.find({
          relations: ['theirPreacher', 'theirZone'],
        });

        const allDisciples = await this.discipleRepository.find({
          relations: ['theirPreacher'],
        });

        try {
          //* Update in all family houses the new relations of the copastor that is updated.
          const familyGroupsByPreacher = allFamilyGroups.filter(
            (familyGroup) => familyGroup.theirPreacher?.id === preacher?.id,
          );

          const allFamilyGroupsByZone = allFamilyGroups.filter(
            (house) => house.theirZone?.id === newZone?.id,
          );

          await Promise.all(
            familyGroupsByPreacher.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
                theirSupervisor: newSupervisor,
                theirZone: newZone,
                zoneName: newZone.zoneName,
                familyGroupNumber:
                  allFamilyGroupsByZone.length === 0
                    ? 1
                    : allFamilyGroupsByZone.length + 1,
                familyGroupCode:
                  allFamilyGroupsByZone.length === 0
                    ? `${newZone.zoneName.toUpperCase()}-${1}`
                    : `${newZone.zoneName.toUpperCase()}-${allFamilyGroupsByZone.length + 1}`,
              });
            }),
          );

          //* Update in all disciples the new relations of the copastor that is updated.
          const disciplesByPreacher = allDisciples.filter(
            (disciple) => disciple.theirPreacher?.id === preacher?.id,
          );

          await Promise.all(
            disciplesByPreacher.map(async (disciple) => {
              await this.discipleRepository.update(disciple.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
                theirSupervisor: newSupervisor,
                theirZone: newZone,
              });
            }),
          );

          //* Reorder family house numbers and code in the old zone
          const allFamilyGroupsByOrder = await this.familyGroupRepository.find({
            relations: ['theirZone'],
            order: { familyGroupNumber: 'ASC' },
          });

          const allResult = allFamilyGroupsByOrder.filter(
            (house) => house.theirZone?.id === preacher.theirZone?.id,
          );

          await Promise.all(
            allResult.map(async (familyGroup, index) => {
              await this.familyGroupRepository.update(familyGroup.id, {
                familyGroupNumber: index + 1,
                familyGroupCode: `${familyGroup.zoneName.toUpperCase()}-${index + 1}`,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }

        return savedPreacher;
      }

      //? Update and save if is same Copastor
      if (preacher.theirSupervisor?.id === theirSupervisor) {
        const updatedPreacher = await this.preacherRepository.preload({
          id: preacher.id,
          ...updatePreacherDto,
          numberChildren: +numberChildren,
          theirChurch: preacher.theirChurch,
          theirPastor: preacher.theirPastor,
          theirCopastor: preacher.theirCopastor,
          theirZone: preacher.theirZone,
          theirSupervisor: preacher.theirSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
          status: status,
        });

        try {
          return await this.preacherRepository.save(updatedPreacher);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Raise Preacher level to Supervisor
    if (
      (preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Preacher) &&
        !preacher.roles.includes(MemberRoles.Treasurer) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Supervisor) &&
        !roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Preacher) &&
        status === Status.Active) ||
      (preacher.roles.includes(MemberRoles.Disciple) &&
        preacher.roles.includes(MemberRoles.Preacher) &&
        preacher.roles.includes(MemberRoles.Treasurer) &&
        !preacher.roles.includes(MemberRoles.Copastor) &&
        !preacher.roles.includes(MemberRoles.Supervisor) &&
        !preacher.roles.includes(MemberRoles.Pastor) &&
        roles.includes(MemberRoles.Disciple) &&
        roles.includes(MemberRoles.Supervisor) &&
        roles.includes(MemberRoles.Treasurer) &&
        !roles.includes(MemberRoles.Copastor) &&
        !roles.includes(MemberRoles.Pastor) &&
        !roles.includes(MemberRoles.Preacher) &&
        status === Status.Active)
    ) {
      //? Raise level and create with relation to copastor
      if (!isDirectRelationToPastor) {
        //* Validation new copastor
        if (!theirCopastor) {
          throw new NotFoundException(
            `Para subir de nivel de Predicador a Supervisor, debe asignar un Co-Pastor.`,
          );
        }

        const newCopastor = await this.copastorRepository.findOne({
          where: { id: theirCopastor },
          relations: ['theirPastor', 'theirChurch'],
        });

        if (!newCopastor) {
          throw new NotFoundException(
            `Co-Pastor con id: ${id} no fue encontrado.`,
          );
        }

        if (newCopastor.status === Status.Inactive) {
          throw new NotFoundException(
            `La propiedad "Estado" en Co-Pastor debe ser "Activo".`,
          );
        }

        //* Validation new pastor according copastor
        if (!newCopastor?.theirPastor) {
          throw new BadRequestException(
            `No se encontró el Pastor, verifica que Co-Pastor tenga un Pastor asignado.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newCopastor?.theirPastor?.id },
          relations: ['theirChurch'],
        });

        if (newPastor.status === Status.Inactive) {
          throw new NotFoundException(
            `La propiedad "Estado" en Pastor debe ser "Activo".`,
          );
        }

        //* Validation new church according copastor
        if (!newCopastor?.theirChurch) {
          throw new BadRequestException(
            `No se encontró la Iglesia, verifica que Co-Pastor tenga una Iglesia asignada.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newCopastor?.theirChurch?.id },
          relations: ['theirMainChurch'],
        });

        if (newChurch.status === Status.Inactive) {
          throw new NotFoundException(
            `La propiedad "Estado" en Iglesia debe ser "Activo".`,
          );
        }

        // Create new instance Supervisor and delete old preacher
        try {
          const newSupervisor = this.supervisorRepository.create({
            ...updatePreacherDto,
            numberChildren: +numberChildren,
            theirPastor: newPastor,
            theirCopastor: newCopastor,
            createdAt: new Date(),
            createdBy: user,
          });

          const savedSupervisor =
            await this.supervisorRepository.save(newSupervisor);

          await this.preacherRepository.remove(preacher); // onDelete subordinate entities (null)

          return savedSupervisor;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? Raise level and create direct relation to pastor
      if (isDirectRelationToPastor) {
        //* Validation new copastor
        if (!theirPastor) {
          throw new NotFoundException(
            `Para subir de nivel de Predicador a Supervisor y asignarle de manera directa un Pastor, debe asignar un Pastor.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: theirPastor },
          relations: ['theirChurch'],
        });

        if (!newPastor) {
          throw new NotFoundException(
            `Pastor con id: ${id} no fue encontrado.`,
          );
        }

        if (newPastor.status === Status.Inactive) {
          throw new NotFoundException(
            `La propiedad "Estado" en Co-Pastor debe ser "Activo".`,
          );
        }

        //* Validation new church according pastor
        if (!newPastor?.theirChurch) {
          throw new BadRequestException(
            `No se encontró la Iglesia, verifica que Pastor tenga una Iglesia asignada.`,
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

        // Create new instance Supervisor and delete old preacher
        try {
          const newSupervisor = this.supervisorRepository.create({
            ...updatePreacherDto,
            numberChildren: +numberChildren,
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: null,
            createdAt: new Date(),
            createdBy: user,
          });

          const savedSupervisor =
            await this.supervisorRepository.save(newSupervisor);

          await this.preacherRepository.remove(preacher); // onDelete subordinate entities (null)

          return savedSupervisor;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    } else {
      throw new BadRequestException(
        `No se puede subir de nivel este registro, el modo debe ser "Activo", los roles ["discípulo", "predicador"], revisar y actualizar el registro.`,
      );
    }
  }

  //! DELETE PREACHER
  async remove(id: string, user: User): Promise<void> {
    // Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const preacher = await this.preacherRepository.findOneBy({ id });

    if (!preacher) {
      throw new NotFoundException(
        `Predicador con id: ${id} no fue encontrado.`,
      );
    }

    //* Update and set in Inactive on Preacher
    const updatedPreacher = await this.preacherRepository.preload({
      id: preacher.id,
      theirChurch: null,
      theirPastor: null,
      theirCopastor: null,
      theirSupervisor: null,
      theirFamilyGroup: null,
      theirZone: null,
      updatedAt: new Date(),
      updatedBy: user,
      status: Status.Inactive,
    });

    try {
      await this.preacherRepository.save(updatedPreacher);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allFamilyGroups = await this.familyGroupRepository.find({
      relations: ['theirPreacher'],
    });

    const allDisciples = await this.discipleRepository.find({
      relations: ['theirPreacher'],
    });

    try {
      //* Update and set to null relationships in Family House
      const familyGroupsByPreacher = allFamilyGroups.filter(
        (familyGroup) => familyGroup.theirPreacher?.id === preacher?.id,
      );

      await Promise.all(
        familyGroupsByPreacher.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup.id, {
            theirPreacher: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciples
      const disciplesByPreacher = allDisciples.filter(
        (disciple) => disciple.theirPreacher?.id === preacher.id,
      );

      await Promise.all(
        disciplesByPreacher.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirPreacher: null,
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
