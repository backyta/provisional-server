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
  PreacherSearchType,
  PreacherSearchSubType,
  PreacherSearchTypeNames,
} from '@/modules/preacher/enums';
import { Preacher } from '@/modules/preacher/entities';
import { preacherDataFormatter } from '@/modules/preacher/helpers';
import { CreatePreacherDto, UpdatePreacherDto } from '@/modules/preacher/dto';

import {
  MemberRole,
  RecordStatus,
  GenderNames,
  MaritalStatusNames,
} from '@/common/enums';
import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';
import { dateFormatterToDDMMYYYY, getBirthDateByMonth } from '@/common/helpers';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities/';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';

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

    if (
      !roles.includes(MemberRole.Disciple) &&
      !roles.includes(MemberRole.Preacher)
    ) {
      throw new BadRequestException(
        `El rol "Discípulo" y "Predicador" deben ser incluidos.`,
      );
    }

    if (
      roles.includes(MemberRole.Pastor) ||
      roles.includes(MemberRole.Copastor) ||
      roles.includes(MemberRole.Supervisor)
    ) {
      throw new BadRequestException(
        `Para crear un Predicador, solo se requiere los roles: "Discípulo" y "Predicador" o también "Tesorero."`,
      );
    }

    if (!theirSupervisor) {
      throw new NotFoundException(
        `Para crear un nuevo Predicador se le debe asignar un Supervisor.`,
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

    if (supervisor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
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

    if (zone?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
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

    if (copastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
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

    if (pastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
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

    if (church?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    //* Create new instance
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

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit, offset = 0, order = 'ASC', isSimpleQuery } = paginationDto;

    if (isSimpleQuery) {
      try {
        const preachers = await this.preacherRepository.find({
          where: { recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return preachers;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    try {
      const preachers = await this.preacherRepository.find({
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
          'theirFamilyGroup',
          'disciples',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (preachers.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return preacherDataFormatter({ preachers }) as any;
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
  ): Promise<Preacher | Preacher[]> {
    const {
      'search-type': searchType,
      'search-sub-type': searchSubType,
      limit,
      offset = 0,
      order,
      isNullFamilyGroup = 'false',
    } = searchTypeAndPaginationDto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido.`);
    }

    //? Find by first name --> Many
    //* Preacher by preacher names
    if (
      term &&
      searchType === PreacherSearchType.FirstName &&
      searchSubType === PreacherSearchSubType.ByPreacherNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con estos nombres: ${firstNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Preachers by supervisor names
    if (
      term &&
      searchType === PreacherSearchType.FirstName &&
      searchSubType === PreacherSearchSubType.PreacherBySupervisorNames
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

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) por los nombres de su supervisor: ${firstNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Preachers by co-pastor names
    if (
      term &&
      searchType === PreacherSearchType.FirstName &&
      searchSubType === PreacherSearchSubType.PreacherByCopastorNames
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

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) por los nombres de su co-pastor: ${firstNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Preachers by pastor names
    if (
      term &&
      searchType === PreacherSearchType.FirstName &&
      searchSubType === PreacherSearchSubType.PreacherByPastorNames
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

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) por los nombres de su pastor: ${firstNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by last name --> Many
    //* Preachers by last names
    if (
      term &&
      searchType === PreacherSearchType.LastName &&
      searchSubType === PreacherSearchSubType.ByPreacherLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con estos apellidos: ${lastNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Preachers by supervisor last names
    if (
      term &&
      searchType === PreacherSearchType.LastName &&
      searchSubType === PreacherSearchSubType.PreacherBySupervisorLastNames
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

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) por los apellidos de su supervisor: ${lastNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Preachers by co-pastor last names
    if (
      term &&
      searchType === PreacherSearchType.LastName &&
      searchSubType === PreacherSearchSubType.PreacherByCopastorLastNames
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

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) por los apellidos de su co-pastor: ${lastNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Preachers by pastor last names
    if (
      term &&
      searchType === PreacherSearchType.LastName &&
      searchSubType === PreacherSearchSubType.PreacherByPastorLastNames
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

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) por los apellidos de su pastor: ${lastNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by full name --> Many
    //* Preachers by full names
    if (
      term &&
      searchType === PreacherSearchType.FullName &&
      searchSubType === PreacherSearchSubType.ByPreacherFullName
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
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con estos nombres y apellidos: ${firstNames} ${lastNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Preachers by supervisor full names
    if (
      term &&
      searchType === PreacherSearchType.FullName &&
      searchSubType === PreacherSearchSubType.PreacherBySupervisorFullName
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

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) por los nombres y apellidos de su supervisor: ${firstNames} ${lastNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Preachers by co-pastor full names
    if (
      term &&
      searchType === PreacherSearchType.FullName &&
      searchSubType === PreacherSearchSubType.PreacherByCopastorFullName
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

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) por los nombres y apellidos de su co-pastor: ${firstNames} ${lastNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Preachers by pastor full names
    if (
      term &&
      searchType === PreacherSearchType.FullName &&
      searchSubType === PreacherSearchSubType.PreacherByPastorFullName
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

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) por los nombres y apellidos de su pastor: ${firstNames} ${lastNames}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by birth date --> Many
    if (term && searchType === PreacherSearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      try {
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron predicadores(as) con este rango de fechas de nacimiento: ${fromDate} - ${toDate}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === PreacherSearchType.BirthMonth) {
      try {
        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const resultPreachers = getBirthDateByMonth({
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

        return preacherDataFormatter({
          preachers: resultPreachers as Preacher[],
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by family-group-code --> Many
    if (term && searchType === PreacherSearchType.FamilyGroupCode) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
          where: {
            familyGroupCode: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const familyGroupsId = familyGroups.map(
          (familyGroup) => familyGroup?.id,
        );

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con este código de grupo familiar: ${term}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by family-group-name --> Many
    if (term && searchType === PreacherSearchType.FamilyGroupName) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
          where: {
            familyGroupName: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const familyGroupsId = familyGroups.map(
          (familyGroup) => familyGroup?.id,
        );

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con este nombre de grupo familiar: ${term}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by zone name --> Many
    if (term && searchType === PreacherSearchType.ZoneName) {
      try {
        const zones = await this.zoneRepository.find({
          where: {
            zoneName: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const zonesId = zones.map((zone) => zone?.id);

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con este nombre de zona: ${term}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by zone id --> Many
    if (term && searchType === PreacherSearchType.ZoneId) {
      try {
        const zone = await this.zoneRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const preachers = await this.preacherRepository.find({
          where: {
            theirZone: zone,
            theirFamilyGroup: isNullFamilyGroup ? IsNull() : null,
            recordStatus: RecordStatus.Active,
          },
          relations: ['theirFamilyGroup'],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return preachers;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Find by gender --> Many
    if (term && searchType === PreacherSearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      try {
        if (!validGenders.includes(genderTerm)) {
          throw new BadRequestException(`Género no válido: ${term}`);
        }

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          const genderInSpanish = GenderNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron predicadores(as) con este género: ${genderInSpanish}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by marital status --> Many
    if (term && searchType === PreacherSearchType.MaritalStatus) {
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

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          const maritalStatusInSpanish =
            MaritalStatusNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron predicadores(as) con este estado civil: ${maritalStatusInSpanish}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === PreacherSearchType.OriginCountry) {
      try {
        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con este país de origen: ${term}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by department --> Many
    if (term && searchType === PreacherSearchType.Department) {
      try {
        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con este departamento: ${term}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by province --> Many
    if (term && searchType === PreacherSearchType.Province) {
      try {
        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con esta provincia: ${term}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by district --> Many
    if (term && searchType === PreacherSearchType.District) {
      try {
        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con este distrito: ${term}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === PreacherSearchType.UrbanSector) {
      try {
        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con este sector urbano: ${term}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by address --> Many
    if (term && searchType === PreacherSearchType.Address) {
      try {
        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          throw new NotFoundException(
            `No se encontraron predicadores(as) con esta dirección: ${term}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by status --> Many
    if (term && searchType === PreacherSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      try {
        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        const preachers = await this.preacherRepository.find({
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
            'theirFamilyGroup',
            'disciples',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (preachers.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron predicadores(as) con este estado de registro: ${value}`,
          );
        }

        return preacherDataFormatter({ preachers }) as any;
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
      !Object.values(PreacherSearchType).includes(
        searchType as PreacherSearchType,
      )
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(PreacherSearchTypeNames).join(', ')}`,
      );
    }

    if (
      term &&
      (PreacherSearchType.FirstName ||
        PreacherSearchType.LastName ||
        PreacherSearchType.FullName) &&
      !searchSubType
    ) {
      throw new BadRequestException(
        `Para buscar por nombres o apellidos el sub-tipo es requerido.`,
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
      recordStatus,
      theirSupervisor,
      theirCopastor,
      theirPastor,
      numberChildren,
      isDirectRelationToPastor,
    } = updatePreacherDto;

    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar el Predicador.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    //* Validation preacher
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
      (preacher.roles.includes(MemberRole.Preacher) &&
        preacher.roles.includes(MemberRole.Disciple) &&
        !preacher.roles.includes(MemberRole.Supervisor) &&
        !preacher.roles.includes(MemberRole.Copastor) &&
        !preacher.roles.includes(MemberRole.Pastor) &&
        !preacher.roles.includes(MemberRole.Treasurer) &&
        (roles.includes(MemberRole.Copastor) ||
          roles.includes(MemberRole.Pastor))) ||
      (preacher.roles.includes(MemberRole.Preacher) &&
        preacher.roles.includes(MemberRole.Disciple) &&
        preacher.roles.includes(MemberRole.Treasurer) &&
        !preacher.roles.includes(MemberRole.Supervisor) &&
        !preacher.roles.includes(MemberRole.Copastor) &&
        !preacher.roles.includes(MemberRole.Pastor) &&
        (roles.includes(MemberRole.Copastor) ||
          roles.includes(MemberRole.Pastor)))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol inferior o superior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor].`,
      );
    }

    //* Update info about Preacher
    if (
      (preacher.roles.includes(MemberRole.Disciple) &&
        preacher.roles.includes(MemberRole.Preacher) &&
        !preacher.roles.includes(MemberRole.Pastor) &&
        !preacher.roles.includes(MemberRole.Copastor) &&
        !preacher.roles.includes(MemberRole.Supervisor) &&
        !preacher.roles.includes(MemberRole.Treasurer) &&
        roles.includes(MemberRole.Disciple) &&
        roles.includes(MemberRole.Preacher) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Supervisor) &&
        !roles.includes(MemberRole.Treasurer)) ||
      (preacher.roles.includes(MemberRole.Disciple) &&
        preacher.roles.includes(MemberRole.Preacher) &&
        preacher.roles.includes(MemberRole.Treasurer) &&
        !preacher.roles.includes(MemberRole.Copastor) &&
        !preacher.roles.includes(MemberRole.Supervisor) &&
        !preacher.roles.includes(MemberRole.Pastor) &&
        roles.includes(MemberRole.Disciple) &&
        roles.includes(MemberRole.Preacher) &&
        roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Supervisor)) ||
      (preacher.roles.includes(MemberRole.Disciple) &&
        preacher.roles.includes(MemberRole.Preacher) &&
        !preacher.roles.includes(MemberRole.Pastor) &&
        !preacher.roles.includes(MemberRole.Copastor) &&
        !preacher.roles.includes(MemberRole.Supervisor) &&
        !preacher.roles.includes(MemberRole.Treasurer) &&
        roles.includes(MemberRole.Disciple) &&
        roles.includes(MemberRole.Preacher) &&
        roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Supervisor)) ||
      (preacher.roles.includes(MemberRole.Disciple) &&
        preacher.roles.includes(MemberRole.Preacher) &&
        preacher.roles.includes(MemberRole.Treasurer) &&
        !preacher.roles.includes(MemberRole.Pastor) &&
        !preacher.roles.includes(MemberRole.Copastor) &&
        !preacher.roles.includes(MemberRole.Supervisor) &&
        roles.includes(MemberRole.Disciple) &&
        roles.includes(MemberRole.Preacher) &&
        !roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Supervisor))
    ) {
      //* Validations
      if (
        preacher?.recordStatus === RecordStatus.Active &&
        recordStatus === RecordStatus.Inactive
      ) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //? Update if their Supervisor is different
      if (preacher?.theirSupervisor?.id !== theirSupervisor) {
        //* Validate supervisor
        if (!theirSupervisor) {
          throw new NotFoundException(
            `Para poder actualizar un Predicador, se le debe asignar un Supervisor.`,
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

        if (newSupervisor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
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

        if (newZone?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
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

        if (newCopastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
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

        if (newPastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
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

        if (newChurch?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        // Update and save
        let savedPreacher: Preacher;
        try {
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
            recordStatus: recordStatus,
          });

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

        //* Update in all family groups the new relations.
        try {
          const familyGroupsByPreacher = allFamilyGroups.filter(
            (familyGroup) => familyGroup?.theirPreacher?.id === preacher?.id,
          );

          const familyGroupsByNewZone = allFamilyGroups.filter(
            (familyGroup) => familyGroup?.theirZone?.id === newZone?.id,
          );

          await Promise.all(
            familyGroupsByPreacher.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
                theirSupervisor: newSupervisor,
                theirZone: newZone,
                familyGroupNumber:
                  familyGroupsByNewZone.length === 0
                    ? 1
                    : familyGroupsByNewZone.length + 1,
                familyGroupCode:
                  familyGroupsByNewZone.length === 0
                    ? `${newZone?.zoneName?.toUpperCase()}-${1}`
                    : `${newZone?.zoneName?.toUpperCase()}-${familyGroupsByNewZone.length + 1}`,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );

          //* Update in all disciples the new relations.
          const disciplesByPreacher = allDisciples.filter(
            (disciple) => disciple?.theirPreacher?.id === preacher?.id,
          );

          await Promise.all(
            disciplesByPreacher.map(async (disciple) => {
              await this.discipleRepository.update(disciple?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
                theirSupervisor: newSupervisor,
                theirZone: newZone,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );

          //* Reorder family group numbers and codes in the old zone (It is also reordered when the zone does not exist)
          const familyGroupsByOrder = await this.familyGroupRepository.find({
            relations: ['theirZone'],
            order: { familyGroupNumber: 'ASC' },
          });

          const familyGroupsByOrderFiltered = familyGroupsByOrder.filter(
            (familyGroup) =>
              familyGroup?.theirZone?.id === preacher?.theirZone?.id,
          );

          await Promise.all(
            familyGroupsByOrderFiltered.map(async (familyGroup, index) => {
              await this.familyGroupRepository.update(familyGroup.id, {
                familyGroupNumber: index + 1,
                familyGroupCode: `${familyGroup?.theirZone?.zoneName?.toUpperCase() ?? 'Sin Zona'}-${index + 1}`,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }

        return savedPreacher;
      }

      //? Update and save if is same Supervisor
      //! Also in the case that the Preacher does not have a zone and we need to get all the new information from the supervisor that was updated with the new zone
      if (preacher?.theirSupervisor?.id === theirSupervisor) {
        //* Validate supervisor
        if (!theirSupervisor) {
          throw new NotFoundException(
            `Para poder actualizar un Predicador, se le debe asignar un Supervisor.`,
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

        if (newSupervisor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
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

        if (newZone?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
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

        if (newCopastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
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

        if (newPastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
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

        if (newChurch?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        let savedPreacher: Preacher;
        try {
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
            recordStatus: recordStatus,
          });

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

        //* Update in all family groups the new relations.
        try {
          const familyGroupsByPreacher = allFamilyGroups.filter(
            (familyGroup) => familyGroup?.theirPreacher?.id === preacher?.id,
          );

          await Promise.all(
            familyGroupsByPreacher.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
                theirSupervisor: newSupervisor,
                familyGroupCode: `${newZone?.zoneName?.toUpperCase()}-${familyGroup.familyGroupNumber}`,
                theirZone: newZone,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );

          //* Update in all disciples the new relations.
          const disciplesByPreacher = allDisciples.filter(
            (disciple) => disciple?.theirPreacher?.id === preacher?.id,
          );

          await Promise.all(
            disciplesByPreacher.map(async (disciple) => {
              await this.discipleRepository.update(disciple?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                theirCopastor: newCopastor,
                theirSupervisor: newSupervisor,
                theirZone: newZone,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }

        return savedPreacher;
      }

      //* Raise Preacher level to Supervisor
      if (
        (preacher.roles.includes(MemberRole.Disciple) &&
          preacher.roles.includes(MemberRole.Preacher) &&
          !preacher.roles.includes(MemberRole.Treasurer) &&
          !preacher.roles.includes(MemberRole.Copastor) &&
          !preacher.roles.includes(MemberRole.Supervisor) &&
          !preacher.roles.includes(MemberRole.Pastor) &&
          roles.includes(MemberRole.Disciple) &&
          roles.includes(MemberRole.Supervisor) &&
          !roles.includes(MemberRole.Treasurer) &&
          !roles.includes(MemberRole.Copastor) &&
          !roles.includes(MemberRole.Pastor) &&
          !roles.includes(MemberRole.Preacher) &&
          recordStatus === RecordStatus.Active) ||
        (preacher.roles.includes(MemberRole.Disciple) &&
          preacher.roles.includes(MemberRole.Preacher) &&
          preacher.roles.includes(MemberRole.Treasurer) &&
          !preacher.roles.includes(MemberRole.Copastor) &&
          !preacher.roles.includes(MemberRole.Supervisor) &&
          !preacher.roles.includes(MemberRole.Pastor) &&
          roles.includes(MemberRole.Disciple) &&
          roles.includes(MemberRole.Supervisor) &&
          roles.includes(MemberRole.Treasurer) &&
          !roles.includes(MemberRole.Copastor) &&
          !roles.includes(MemberRole.Pastor) &&
          !roles.includes(MemberRole.Preacher) &&
          recordStatus === RecordStatus.Active)
      ) {
        //? Raise level and create with relation to copastor
        if (!isDirectRelationToPastor) {
          //* Validation new copastor
          if (!theirCopastor) {
            throw new NotFoundException(
              `Para subir de nivel de Predicador a Supervisor, se le debe asignar un Co-Pastor.`,
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

          if (newCopastor?.recordStatus === RecordStatus.Inactive) {
            throw new NotFoundException(
              `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
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

          if (newPastor?.recordStatus === RecordStatus.Inactive) {
            throw new NotFoundException(
              `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
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

          if (newChurch?.recordStatus === RecordStatus.Inactive) {
            throw new NotFoundException(
              `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
            );
          }

          //! Create new instance Supervisor and delete old preacher
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

          if (newPastor?.recordStatus === RecordStatus.Inactive) {
            throw new NotFoundException(
              `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
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

          if (newChurch?.recordStatus === RecordStatus.Inactive) {
            throw new NotFoundException(
              `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
            );
          }

          //! Create new instance Supervisor and delete old preacher
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
          `No se puede subir de nivel este Predicador, el modo debe ser "Activo", los roles deben ser: ["discípulo", "predicador"], revisar y actualizar el registro.`,
        );
      }
    }
  }

  //! DELETE PREACHER
  async remove(id: string, user: User): Promise<void> {
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
    try {
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
        recordStatus: RecordStatus.Inactive,
      });

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
      //* Update and set to null relationships in Family Group
      const familyGroupsByPreacher = allFamilyGroups.filter(
        (familyGroup) => familyGroup?.theirPreacher?.id === preacher?.id,
      );

      await Promise.all(
        familyGroupsByPreacher.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup?.id, {
            theirPreacher: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciples
      const disciplesByPreacher = allDisciples.filter(
        (disciple) => disciple?.theirPreacher?.id === preacher?.id,
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
      }
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador y que revise los registros de consola.',
    );
  }
}
