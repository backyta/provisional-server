import { Between, FindOptionsOrderValue, ILike, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { RecordStatus, SearchTypeNames } from '@/common/enums';
import { dateFormatterToDDMMYYY } from '@/common/helpers';
import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

import {
  MemberType,
  MemberTypeNames,
  OfferingIncomeSearchType,
  OfferingIncomeCreationType,
  OfferingIncomeSearchSubType,
  OfferingIncomeSearchTypeNames,
  OfferingIncomeCreationSubType,
  OfferingIncomeCreationShiftTypeNames,
} from '@/modules/offering/income/enums';
import {
  CreateOfferingIncomeDto,
  UpdateOfferingIncomeDto,
} from '@/modules/offering/income/dto';
import { RepositoryType } from '@/modules/offering/income/types';
import { formatDataOfferingIncome } from '@/modules/offering/income/helpers';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';
import { OfferingIncome } from '@/modules/offering/income/entities';

@Injectable()
export class OfferingIncomeService {
  private readonly logger = new Logger('IncomeService');

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

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,
  ) {}

  //* CREATE OFFERING INCOME
  async create(
    createOfferingIncomeDto: CreateOfferingIncomeDto,
    user: User,
  ): Promise<OfferingIncome> {
    const {
      memberId,
      zoneId,
      familyGroupId,
      memberType,
      type,
      subType,
      imageUrls,
      amount,
      shift,
    } = createOfferingIncomeDto;

    //* Validations
    if (type === OfferingIncomeCreationType.Offering) {
      //? Family group
      if (subType === OfferingIncomeCreationSubType.FamilyGroup) {
        if (!familyGroupId) {
          throw new NotFoundException(`El Grupo Familiar es requerido.`);
        }

        const familyGroup = await this.familyGroupRepository.findOne({
          where: { id: familyGroupId },
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
            `Grupo familiar con id: ${familyGroupId}, no fue encontrado.`,
          );
        }

        if (!familyGroup?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Grupo familiar debe ser "Activo".`,
          );
        }

        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            disciple: null,
            preacher: null,
            supervisor: null,
            copastor: null,
            pastor: null,
            zone: null,
            memberType: null,
            shift: null,
            imageUrls: imageUrls,
            familyGroup: familyGroup,
            createdAt: new Date(),
            createdBy: user,
          });

          return await this.offeringIncomeRepository.save(newOfferingIncome);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? Sunday worship and Sunday school
      if (
        subType === OfferingIncomeCreationSubType.SundaySchool ||
        subType === OfferingIncomeCreationSubType.SundayWorship
      ) {
        if (!shift) {
          throw new NotFoundException(`El turno es requerido.`);
        }

        if (
          !Object.keys(OfferingIncomeCreationShiftTypeNames).includes(shift)
        ) {
          throw new NotFoundException(
            `El turno debe ser uno de los siguientes valores:${Object.values(OfferingIncomeCreationShiftTypeNames).join(', ')} `,
          );
        }

        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            disciple: null,
            preacher: null,
            supervisor: null,
            copastor: null,
            pastor: null,
            zone: null,
            familyGroup: null,
            memberType: null,
            shift: shift,
            imageUrls: imageUrls,
            createdAt: new Date(),
            createdBy: user,
          });

          return await this.offeringIncomeRepository.save(newOfferingIncome);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? Zonal fasting and Zonal vigil
      if (
        subType === OfferingIncomeCreationSubType.ZonalFasting ||
        subType === OfferingIncomeCreationSubType.ZonalVigil
      ) {
        if (!zoneId) {
          throw new NotFoundException(`La Zona es requerida.`);
        }

        const zone = await this.zoneRepository.findOne({
          where: { id: zoneId },
          relations: [
            'theirChurch',
            'theirPastor',
            'theirCopastor',
            'theirSupervisor',
          ],
        });

        if (!zone) {
          throw new NotFoundException(
            `Zona con id: ${familyGroupId}, no fue encontrada.`,
          );
        }

        if (!zone?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
          );
        }

        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            disciple: null,
            preacher: null,
            supervisor: null,
            copastor: null,
            pastor: null,
            zone: zone,
            memberType: null,
            shift: null,
            imageUrls: imageUrls,
            familyGroup: null,
            createdAt: new Date(),
            createdBy: user,
          });

          return await this.offeringIncomeRepository.save(newOfferingIncome);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? General fasting, vigil, youth worship, united worship, activities
      if (
        subType === OfferingIncomeCreationSubType.GeneralFasting ||
        subType === OfferingIncomeCreationSubType.GeneralFasting ||
        subType === OfferingIncomeCreationSubType.YouthWorship ||
        subType === OfferingIncomeCreationSubType.UnitedWorship ||
        subType === OfferingIncomeCreationSubType.Activities
      ) {
        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            disciple: null,
            preacher: null,
            supervisor: null,
            copastor: null,
            pastor: null,
            zone: null,
            familyGroup: null,
            memberType: null,
            shift: null,
            imageUrls: imageUrls,
            createdAt: new Date(),
            createdBy: user,
          });

          return await this.offeringIncomeRepository.save(newOfferingIncome);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? Church ground and special
      if (
        subType === OfferingIncomeCreationSubType.ChurchGround ||
        subType === OfferingIncomeCreationSubType.Special
      ) {
        if (!memberType) {
          throw new NotFoundException(`El tipo de miembro es requerido.`);
        }

        if (!memberId) {
          throw new NotFoundException(
            `El miembro (discípulo, predicador, supervisor, pastor o copastor) es requerido.`,
          );
        }

        //* Pastor
        if (memberType === MemberType.Pastor) {
          const pastor = await this.pastorRepository.findOne({
            where: { id: memberId },
            relations: ['theirChurch'],
          });

          if (!pastor) {
            throw new NotFoundException(
              `Pastor con id: ${familyGroupId}, no fue encontrado.`,
            );
          }

          if (!pastor?.recordStatus) {
            throw new BadRequestException(
              `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
            );
          }

          try {
            const newOfferingIncome = this.offeringIncomeRepository.create({
              ...createOfferingIncomeDto,
              amount: +amount,
              memberType: memberType,
              disciple: null,
              preacher: null,
              supervisor: null,
              copastor: null,
              pastor: pastor,
              zone: null,
              shift: null,
              imageUrls: imageUrls,
              familyGroup: null,
              createdAt: new Date(),
              createdBy: user,
            });

            return await this.offeringIncomeRepository.save(newOfferingIncome);
          } catch (error) {
            this.handleDBExceptions(error);
          }
        }

        //* Co-Pastor
        if (memberType === MemberType.Copastor) {
          const copastor = await this.copastorRepository.findOne({
            where: { id: memberId },
            relations: ['theirChurch', 'theirPastor'],
          });

          if (!copastor) {
            throw new NotFoundException(
              `Co-Pastor con id: ${familyGroupId}, no fue encontrado.`,
            );
          }

          if (!copastor?.recordStatus) {
            throw new BadRequestException(
              `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
            );
          }

          try {
            const newOfferingIncome = this.offeringIncomeRepository.create({
              ...createOfferingIncomeDto,
              amount: +amount,
              memberType: memberType,
              disciple: null,
              preacher: null,
              supervisor: null,
              copastor: copastor,
              pastor: null,
              zone: null,
              shift: null,
              imageUrls: imageUrls,
              familyGroup: null,
              createdAt: new Date(),
              createdBy: user,
            });

            return await this.offeringIncomeRepository.save(newOfferingIncome);
          } catch (error) {
            this.handleDBExceptions(error);
          }
        }

        //* Supervisor
        if (memberType === MemberType.Supervisor) {
          const supervisor = await this.supervisorRepository.findOne({
            where: { id: memberId },
            relations: [
              'theirChurch',
              'theirPastor',
              'theirCopastor',
              'theirZone',
            ],
          });

          if (!supervisor) {
            throw new NotFoundException(
              `Supervisor con id: ${familyGroupId}, no fue encontrado.`,
            );
          }

          if (!supervisor?.recordStatus) {
            throw new BadRequestException(
              `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
            );
          }

          try {
            const newOfferingIncome = this.offeringIncomeRepository.create({
              ...createOfferingIncomeDto,
              amount: +amount,
              memberType: memberType,
              disciple: null,
              preacher: null,
              supervisor: supervisor,
              copastor: null,
              pastor: null,
              zone: null,
              shift: null,
              imageUrls: imageUrls,
              familyGroup: null,
              createdAt: new Date(),
              createdBy: user,
            });

            return await this.offeringIncomeRepository.save(newOfferingIncome);
          } catch (error) {
            this.handleDBExceptions(error);
          }
        }

        //* Preacher
        if (memberType === MemberType.Preacher) {
          const preacher = await this.preacherRepository.findOne({
            where: { id: memberId },
            relations: [
              'theirChurch',
              'theirPastor',
              'theirCopastor',
              'theirSupervisor',
              'theirZone',
              'theirFamilyGroup',
            ],
          });

          if (!preacher) {
            throw new NotFoundException(
              `Predicador con id: ${familyGroupId}, no fue encontrado.`,
            );
          }

          if (!preacher?.recordStatus) {
            throw new BadRequestException(
              `La propiedad "Estado de registro" en Predicador debe ser "Activo".`,
            );
          }

          try {
            const newOfferingIncome = this.offeringIncomeRepository.create({
              ...createOfferingIncomeDto,
              amount: +amount,
              memberType: memberType,
              disciple: null,
              preacher: preacher,
              supervisor: null,
              copastor: null,
              pastor: null,
              zone: null,
              shift: null,
              imageUrls: imageUrls,
              familyGroup: null,
              createdAt: new Date(),
              createdBy: user,
            });

            return await this.offeringIncomeRepository.save(newOfferingIncome);
          } catch (error) {
            this.handleDBExceptions(error);
          }
        }

        //* Disciple
        if (memberType === MemberType.Disciple) {
          const disciple = await this.discipleRepository.findOne({
            where: { id: memberId },
            relations: [
              'theirChurch',
              'theirPastor',
              'theirCopastor',
              'theirSupervisor',
              'theirZone',
              'theirPreacher',
              'theirFamilyGroup',
            ],
          });

          if (!disciple) {
            throw new NotFoundException(
              `Discípulo con id: ${familyGroupId}, no fue encontrado.`,
            );
          }

          if (!disciple?.recordStatus) {
            throw new BadRequestException(
              `La propiedad "Estado de registro" en Discípulo debe ser "Activo".`,
            );
          }

          try {
            const newOfferingIncome = this.offeringIncomeRepository.create({
              ...createOfferingIncomeDto,
              amount: +amount,
              memberType: memberType,
              disciple: disciple,
              preacher: null,
              supervisor: null,
              copastor: null,
              pastor: null,
              zone: null,
              shift: null,
              imageUrls: imageUrls,
              familyGroup: null,
              createdAt: new Date(),
              createdBy: user,
            });

            return await this.offeringIncomeRepository.save(newOfferingIncome);
          } catch (error) {
            this.handleDBExceptions(error);
          }
        }
      }
    }

    //? Income adjustment
    if (type === OfferingIncomeCreationType.IncomeAdjustment) {
      try {
        const newOfferingIncome = this.offeringIncomeRepository.create({
          ...createOfferingIncomeDto,
          amount: +amount,
          disciple: null,
          preacher: null,
          supervisor: null,
          copastor: null,
          pastor: null,
          zone: null,
          memberType: null,
          shift: null,
          imageUrls: imageUrls,
          familyGroup: null,
          createdAt: new Date(),
          createdBy: user,
        });

        return await this.offeringIncomeRepository.save(newOfferingIncome);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit, offset = 0, order = 'ASC' } = paginationDto;

    const offeringsIncome = await this.offeringIncomeRepository.find({
      where: { recordStatus: RecordStatus.Active },
      take: limit,
      skip: offset,
      relations: [
        'updatedBy',
        'createdBy',
        'pastor',
        'copastor',
        'supervisor',
        'preacher',
        'disciple',
        'familyGroup',
        'zone',
      ],
      order: { createdAt: order as FindOptionsOrderValue },
    });

    return formatDataOfferingIncome({ offeringsIncome }) as any;
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<OfferingIncome | OfferingIncome[]> {
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

    //? Find by all types
    //* By date
    if (
      term &&
      (searchType === OfferingIncomeSearchType.SundayWorship ||
        searchType === OfferingIncomeSearchType.SundaySchool ||
        searchType === OfferingIncomeSearchType.FamilyGroup ||
        searchType === OfferingIncomeSearchType.ZonalFasting ||
        searchType === OfferingIncomeSearchType.ZonalVigil ||
        searchType === OfferingIncomeSearchType.GeneralFasting ||
        searchType === OfferingIncomeSearchType.GeneralVigil ||
        searchType === OfferingIncomeSearchType.YouthWorship ||
        searchType === OfferingIncomeSearchType.UnitedWorship ||
        searchType === OfferingIncomeSearchType.Activities ||
        searchType === OfferingIncomeSearchType.Special ||
        searchType === OfferingIncomeSearchType.ChurchGround ||
        searchType === OfferingIncomeSearchType.IncomeAdjustment) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByDate
    ) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          date: Between(fromDate, toDate),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        const fromDate = dateFormatterToDDMMYYY(fromTimestamp);
        const toDate = dateFormatterToDDMMYYY(toTimestamp);

        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con este rango de fechas: ${fromDate} - ${toDate}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Offerings Sunday Worship and Sunday School --> Many
    //* By shift
    if (
      term &&
      (searchType === OfferingIncomeSearchType.SundayWorship ||
        searchType === OfferingIncomeSearchType.SundaySchool) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByShift
    ) {
      const shiftTerm = term.toLowerCase();
      const validShifts = ['day', 'afternoon'];

      if (!validShifts.includes(shiftTerm)) {
        throw new BadRequestException(`Turno no válido: ${term}`);
      }

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          shift: shiftTerm,
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        const shiftInSpanish =
          OfferingIncomeCreationShiftTypeNames[term.toLowerCase()] ?? term;

        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con este turno: ${shiftInSpanish}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By shift and date
    if (
      term &&
      (searchType === OfferingIncomeSearchType.SundayWorship ||
        searchType === OfferingIncomeSearchType.SundaySchool) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByShiftDate
    ) {
      const [shift, date] = term.split('&');

      const shiftTerm = shift.toLowerCase();
      const validShifts = ['day', 'afternoon'];

      if (!validShifts.includes(shiftTerm)) {
        throw new BadRequestException(`Turno no válido: ${term}`);
      }

      const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          date: Between(fromDate, toDate),
          shift: shiftTerm,
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        const fromDate = dateFormatterToDDMMYYY(fromTimestamp);
        const toDate = dateFormatterToDDMMYYY(toTimestamp);

        const shiftInSpanish =
          OfferingIncomeCreationShiftTypeNames[shiftTerm.toLowerCase()] ?? term;

        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con este rango de fechas: ${fromDate} - ${toDate} y con este turno: ${shiftInSpanish}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Offerings Family Group --> Many
    //* By Zone
    if (
      term &&
      searchType === OfferingIncomeSearchType.FamilyGroup &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByZone
    ) {
      const zones = await this.zoneRepository.find({
        where: {
          zoneName: ILike(`%${term}%`),
          recordStatus: RecordStatus.Active,
        },
        relations: ['familyGroups'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const familyGroupsByZone = zones.map((zone) => zone.familyGroups).flat();

      const familyGroupId = familyGroupsByZone.map(
        (familyGroup) => familyGroup.id,
      );

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          familyGroup: In(familyGroupId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con esta zona: ${term}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Zone and date
    if (
      term &&
      searchType === OfferingIncomeSearchType.FamilyGroup &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByZoneDate
    ) {
      const [zone, date] = term.split('&');

      const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      const zones = await this.zoneRepository.find({
        where: {
          zoneName: ILike(`%${zone}%`),
          recordStatus: RecordStatus.Active,
        },
        relations: ['familyGroups'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const familyGroupsByZone = zones.map((zone) => zone.familyGroups).flat();

      const familyGroupId = familyGroupsByZone.map(
        (familyGroup) => familyGroup.id,
      );

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          date: Between(fromDate, toDate),
          familyGroup: In(familyGroupId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        const fromDate = dateFormatterToDDMMYYY(fromTimestamp);
        const toDate = dateFormatterToDDMMYYY(toTimestamp);

        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con este rango de fechas: ${fromDate} - ${toDate} y esta zona: ${zone}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Group Code
    if (
      term &&
      searchType === OfferingIncomeSearchType.FamilyGroup &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByGroupCode
    ) {
      const familyGroup = await this.familyGroupRepository.findOne({
        where: {
          familyGroupCode: ILike(`%${term}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          familyGroup: familyGroup,
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con esta código de grupo familiar: ${term}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Group Code and date
    if (
      term &&
      searchType === OfferingIncomeSearchType.FamilyGroup &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByGroupCodeDate
    ) {
      const [code, date] = term.split('&');

      const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      const familyGroup = await this.familyGroupRepository.findOne({
        where: {
          familyGroupCode: ILike(`%${code}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          date: Between(fromDate, toDate),
          familyGroup: familyGroup,
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        const fromDate = dateFormatterToDDMMYYY(fromTimestamp);
        const toDate = dateFormatterToDDMMYYY(toTimestamp);

        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con este rango de fechas: ${fromDate} - ${toDate} y este código de grupo: ${code}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Preacher names
    if (
      term &&
      searchType === OfferingIncomeSearchType.FamilyGroup &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByPreacherNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const preachers = await this.preacherRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          recordStatus: RecordStatus.Active,
        },
        relations: ['theirFamilyGroup'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const familyGroups = preachers.map(
        (preacher) => preacher.theirFamilyGroup,
      );

      const familyGroupsId = familyGroups.map((familyGroup) => familyGroup.id);

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          familyGroup: In(familyGroupsId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con estos nombres de predicador: ${firstNames}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Preacher last names
    if (
      term &&
      searchType === OfferingIncomeSearchType.FamilyGroup &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByPreacherLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const preachers = await this.preacherRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        relations: ['theirFamilyGroup'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const familyGroups = preachers.map(
        (preacher) => preacher.theirFamilyGroup,
      );

      const familyGroupsId = familyGroups.map((familyGroup) => familyGroup.id);

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          familyGroup: In(familyGroupsId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con estos apellidos de predicador: ${lastNames}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Preacher full names
    if (
      term &&
      searchType === OfferingIncomeSearchType.FamilyGroup &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByPreacherFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const preachers = await this.preacherRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        relations: ['theirFamilyGroup'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const familyGroups = preachers.map(
        (preacher) => preacher.theirFamilyGroup,
      );

      const familyGroupsId = familyGroups.map((familyGroup) => familyGroup.id);

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          familyGroup: In(familyGroupsId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con estos nombres y apellidos de predicador: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Offering Zonal Fasting and Zonal Vigil --> Many
    //* By Zone
    if (
      term &&
      (searchType === OfferingIncomeSearchType.ZonalFasting ||
        searchType === OfferingIncomeSearchType.ZonalVigil) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByZone
    ) {
      const zones = await this.zoneRepository.find({
        where: {
          zoneName: ILike(`%${term}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const zonesId = zones.map((zone) => zone.id);

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          zone: In(zonesId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con esta zona: ${term}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Zone and date
    if (
      term &&
      (searchType === OfferingIncomeSearchType.ZonalFasting ||
        searchType === OfferingIncomeSearchType.ZonalVigil) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByZoneDate
    ) {
      const [zone, date] = term.split('&');

      const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      const zones = await this.zoneRepository.find({
        where: {
          zoneName: ILike(`%${zone}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const zonesId = zones.map((zone) => zone.id);

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          date: Between(fromDate, toDate),
          zone: In(zonesId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        const fromDate = dateFormatterToDDMMYYY(fromTimestamp);
        const toDate = dateFormatterToDDMMYYY(toTimestamp);

        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con este rango de fechas: ${fromDate} - ${toDate} y esta zona: ${zone}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Supervisor names
    if (
      term &&
      (searchType === OfferingIncomeSearchType.ZonalFasting ||
        searchType === OfferingIncomeSearchType.ZonalVigil) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingBySupervisorNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          recordStatus: RecordStatus.Active,
        },
        relations: ['theirZone'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const zonesId = supervisors.map((supervisor) => supervisor.theirZone?.id);

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          zone: In(zonesId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con estos  nombres de supervisor: ${firstNames}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Supervisor last names
    if (
      term &&
      (searchType === OfferingIncomeSearchType.ZonalFasting ||
        searchType === OfferingIncomeSearchType.ZonalVigil) &&
      searchSubType ===
        OfferingIncomeSearchSubType.OfferingBySupervisorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        relations: ['theirZone'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const zonesId = supervisors.map(
        (supervisor) => supervisor?.theirZone?.id,
      );

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          zone: In(zonesId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con estos apellidos de supervisor: ${lastNames}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Preacher full names
    if (
      term &&
      (searchType === OfferingIncomeSearchType.ZonalFasting ||
        searchType === OfferingIncomeSearchType.ZonalVigil) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingBySupervisorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      const supervisors = await this.supervisorRepository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        relations: ['theirZone'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const zonesId = supervisors.map((preacher) => preacher?.theirZone?.id);

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          zone: In(zonesId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con estos nombres y apellidos de supervisor: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //? Special and Church ground --> Many
    //* By Contributor names
    if (
      term &&
      (searchType === OfferingIncomeSearchType.Special ||
        searchType === OfferingIncomeSearchType.ChurchGround) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByContributorNames
    ) {
      const [memberType, names] = term.split('&');

      const firstNames = names.replace(/\+/g, ' ');

      let repository: RepositoryType;

      if (memberType === MemberType.Pastor) {
        repository = this.pastorRepository;
      }
      if (memberType === MemberType.Copastor) {
        repository = this.copastorRepository;
      }
      if (memberType === MemberType.Supervisor) {
        repository = this.supervisorRepository;
      }
      if (memberType === MemberType.Preacher) {
        repository = this.preacherRepository;
      }
      if (memberType === MemberType.Disciple) {
        repository = this.discipleRepository;
      }

      const members = await repository.find({
        where: {
          firstName: ILike(`%${names}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const membersId = members.map(
        (member: Pastor | Copastor | Supervisor | Preacher | Disciple) =>
          member?.id,
      );

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          [`${memberType}`]: In(membersId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        const memberTypeInSpanish =
          MemberTypeNames[memberType.toLowerCase()] ?? memberType;
        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con este tipo de miembro: ${memberTypeInSpanish} y estos nombres: ${firstNames}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Supervisor last names
    if (
      term &&
      (searchType === OfferingIncomeSearchType.Special ||
        searchType === OfferingIncomeSearchType.ChurchGround) &&
      searchSubType ===
        OfferingIncomeSearchSubType.OfferingByContributorLastNames
    ) {
      const [memberType, names] = term.split('&');

      const lastNames = names.replace(/\+/g, ' ');

      let repository: RepositoryType;

      if (memberType === MemberType.Pastor) {
        repository = this.pastorRepository;
      }
      if (memberType === MemberType.Copastor) {
        repository = this.copastorRepository;
      }
      if (memberType === MemberType.Supervisor) {
        repository = this.supervisorRepository;
      }
      if (memberType === MemberType.Preacher) {
        repository = this.preacherRepository;
      }
      if (memberType === MemberType.Disciple) {
        repository = this.discipleRepository;
      }

      const members = await repository.find({
        where: {
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const membersId = members.map(
        (member: Pastor | Copastor | Supervisor | Preacher | Disciple) =>
          member?.id,
      );

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          [`${memberType}`]: In(membersId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        const memberTypeInSpanish =
          MemberTypeNames[memberType.toLowerCase()] ?? memberType;
        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con este tipo de miembro: ${memberTypeInSpanish} y estos apellidos: ${lastNames}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //* By Preacher full names
    if (
      term &&
      (searchType === OfferingIncomeSearchType.Special ||
        searchType === OfferingIncomeSearchType.ChurchGround) &&
      searchSubType ===
        OfferingIncomeSearchSubType.OfferingByContributorFullName
    ) {
      const [memberType, names] = term.split('&');

      const firstNames = names.split('-')[0].replace(/\+/g, ' ');
      const lastNames = names.split('-')[1].replace(/\+/g, ' ');

      let repository: RepositoryType;

      if (memberType === MemberType.Pastor) {
        repository = this.pastorRepository;
      }
      if (memberType === MemberType.Copastor) {
        repository = this.copastorRepository;
      }
      if (memberType === MemberType.Supervisor) {
        repository = this.supervisorRepository;
      }
      if (memberType === MemberType.Preacher) {
        repository = this.preacherRepository;
      }
      if (memberType === MemberType.Disciple) {
        repository = this.discipleRepository;
      }

      const members = await repository.find({
        where: {
          firstName: ILike(`%${firstNames}%`),
          lastName: ILike(`%${lastNames}%`),
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const membersId = members.map(
        (member: Pastor | Copastor | Supervisor | Preacher | Disciple) =>
          member?.id,
      );

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          subType: searchType,
          [`${memberType}`]: In(membersId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        const memberTypeInSpanish =
          MemberTypeNames[memberType.toLowerCase()] ?? memberType;

        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con este tipo de miembro: ${memberTypeInSpanish} y estos nombres y apellidos: ${firstNames} ${lastNames}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    // ? Offerings by status --> Many
    if (term && searchType === OfferingIncomeSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: {
          recordStatus: recordStatusTerm,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'familyGroup',
          'zone',
          'pastor',
          'copastor',
          'supervisor',
          'preacher',
          'disciple',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (offeringsIncome.length === 0) {
        const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

        throw new NotFoundException(
          `No se encontraron ingresos de ofrendas (${SearchTypeNames[searchType]}) con este estado: ${value}`,
        );
      }

      try {
        return formatDataOfferingIncome({ offeringsIncome }) as any;
      } catch (error) {
        throw new BadRequestException(
          `Ocurrió un error, habla con el administrador`,
        );
      }
    }

    //! General Exceptions
    if (
      term &&
      !Object.values(OfferingIncomeSearchType).includes(
        searchType as OfferingIncomeSearchType,
      )
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(OfferingIncomeSearchTypeNames).join(', ')}`,
      );
    }

    if (
      term &&
      (OfferingIncomeSearchType.SundayWorship ||
        OfferingIncomeSearchType.SundaySchool ||
        OfferingIncomeSearchType.FamilyGroup ||
        OfferingIncomeSearchType.ZonalFasting ||
        OfferingIncomeSearchType.ZonalVigil ||
        OfferingIncomeSearchType.GeneralFasting ||
        OfferingIncomeSearchType.GeneralVigil ||
        OfferingIncomeSearchType.YouthWorship ||
        OfferingIncomeSearchType.UnitedWorship ||
        OfferingIncomeSearchType.Activities ||
        OfferingIncomeSearchType.Special ||
        OfferingIncomeSearchType.ChurchGround ||
        OfferingIncomeSearchType.IncomeAdjustment) &&
      !searchSubType
    ) {
      throw new BadRequestException(
        `Para hacer búsquedas por ingresos de ofrendas el sub-tipo es requerido`,
      );
    }
  }

  update(id: number, updateIncomeDto: UpdateOfferingIncomeDto) {
    return `This action updates a #${id} income`;
  }

  remove(id: number) {
    return `This action removes a #${id} income`;
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
      'Sucedió un error inesperado, revise los registros de consola',
    );
  }
}
