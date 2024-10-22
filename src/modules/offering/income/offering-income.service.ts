import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsOrderValue,
  ILike,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { format } from 'date-fns';
import { isUUID } from 'class-validator';
import { toZonedTime } from 'date-fns-tz';

import { RecordStatus, DashboardSearchType } from '@/common/enums';
import { dateFormatterToDDMMYYYY } from '@/common/helpers';
import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

import { DeleteOfferingDto } from '@/modules/offering/shared/dto';

import {
  MemberType,
  MemberTypeNames,
  ExchangeCurrencyType,
  OfferingIncomeSearchType,
  ExchangeCurrencyTypeNames,
  OfferingIncomeCreationType,
  OfferingIncomeSearchSubType,
  OfferingIncomeSearchTypeNames,
  OfferingIncomeCreationSubType,
  OfferingIncomeCreationSubTypeNames,
  OfferingIncomeCreationShiftTypeNames,
  OfferingIncomeCreationCategory,
  OfferingIncomeCreationCategoryNames,
} from '@/modules/offering/income/enums';
import {
  CreateOfferingIncomeDto,
  UpdateOfferingIncomeDto,
} from '@/modules/offering/income/dto';
import { RepositoryType } from '@/modules/offering/income/types';
import {
  lastSundayOfferingsDataFormatter,
  offeringIncomeDataFormatter,
  topOfferingsFamilyGroupsDataFormatter,
} from '@/modules/offering/income/helpers';

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

import {
  CurrencyType,
  OfferingReasonEliminationType,
  OfferingReasonEliminationTypeNames,
} from '@/modules/offering/shared/enums';

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
      type,
      shift,
      date,
      zoneId,
      amount,
      subType,
      category,
      memberId,
      churchId,
      currency,
      imageUrls,
      memberType,
      familyGroupId,
    } = createOfferingIncomeDto;

    //* Validations
    if (type === OfferingIncomeCreationType.Offering) {
      //? Family group
      if (subType === OfferingIncomeCreationSubType.FamilyGroup) {
        if (!churchId) {
          throw new NotFoundException(`La iglesia es requerida.`);
        }

        const church = await this.churchRepository.findOne({
          where: { id: churchId },
          relations: ['theirMainChurch'],
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id: ${churchId}, no fue encontrado.`,
          );
        }

        if (!church?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

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

        //* Validate if exists record already
        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            subType: subType,
            category: category,
            church: church,
            familyGroup: familyGroup,
            date: new Date(date),
            currency: currency,
            recordStatus: RecordStatus.Active,
          },
        });

        if (offeringsIncome.length > 0) {
          const offeringDate = dateFormatterToDDMMYYYY(
            new Date(date).getTime(),
          );

          throw new NotFoundException(
            `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Iglesia: ${church.churchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]}, Divisa: ${currency} y Fecha: ${offeringDate}.`,
          );
        }

        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            church: church,
            disciple: null,
            preacher: null,
            supervisor: null,
            copastor: null,
            pastor: null,
            zone: null,
            memberType: null,
            shift: null,
            category: category,
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

      //? Sunday service
      if (subType === OfferingIncomeCreationSubType.SundayService) {
        if (!churchId) {
          throw new NotFoundException(`La iglesia es requerida.`);
        }

        const church = await this.churchRepository.findOne({
          where: { id: churchId },
          relations: ['theirMainChurch'],
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id: ${churchId}, no fue encontrado.`,
          );
        }

        if (!church?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        //* Validate if exists record already
        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            subType: subType,
            category: category,
            church: church,
            shift: shift,
            date: new Date(date),
            currency: currency,
            recordStatus: RecordStatus.Active,
          },
        });

        if (offeringsIncome.length > 0) {
          const offeringDate = dateFormatterToDDMMYYYY(
            new Date(date).getTime(),
          );

          throw new NotFoundException(
            `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Iglesia: ${church.churchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]}, Divisa: ${currency}, Turno: ${OfferingIncomeCreationShiftTypeNames[shift]} y Fecha: ${offeringDate}.`,
          );
        }

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
            church: church,
            disciple: null,
            preacher: null,
            supervisor: null,
            copastor: null,
            pastor: null,
            zone: null,
            familyGroup: null,
            memberType: null,
            category: category,
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

      //? Sunday School, Youth service
      if (
        subType === OfferingIncomeCreationSubType.SundaySchool ||
        subType === OfferingIncomeCreationSubType.YouthService ||
        subType === OfferingIncomeCreationSubType.ChurchGround ||
        subType === OfferingIncomeCreationSubType.Special
      ) {
        if (!churchId) {
          throw new NotFoundException(`La iglesia es requerida.`);
        }

        const church = await this.churchRepository.findOne({
          where: { id: churchId },
          relations: ['theirMainChurch'],
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id: ${churchId}, no fue encontrado.`,
          );
        }

        if (!church?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        //* Validate if exists record already
        let offeringIncome: OfferingIncome[];
        if (category === OfferingIncomeCreationCategory.OfferingBox) {
          offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              subType: subType,
              category: category,
              church: church,
              shift: shift,
              date: new Date(date),
              currency: currency,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (
          category === OfferingIncomeCreationCategory.Activities ||
          category === OfferingIncomeCreationCategory.ExternalDonation
        ) {
          offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              subType: subType,
              category: category,
              church: church,
              date: new Date(date),
              currency: currency,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        let pastor: Pastor;
        let copastor: Copastor;
        let supervisor: Supervisor;
        let preacher: Preacher;
        let disciple: Disciple;

        if (category === OfferingIncomeCreationCategory.InternalDonation) {
          if (memberType === MemberType.Pastor) {
            pastor = await this.pastorRepository.findOne({
              where: { id: memberId },
              relations: ['theirChurch'],
            });

            offeringIncome = await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: subType,
                category: category,
                memberType: memberType,
                pastor: pastor,
                date: new Date(date),
                currency: currency,
                recordStatus: RecordStatus.Active,
              },
            });
          }

          if (memberType === MemberType.Copastor) {
            copastor = await this.copastorRepository.findOne({
              where: { id: memberId },
              relations: ['theirChurch'],
            });

            offeringIncome = await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: subType,
                category: category,
                memberType: memberType,
                copastor: copastor,
                date: new Date(date),
                currency: currency,
                recordStatus: RecordStatus.Active,
              },
            });
          }
          if (memberType === MemberType.Supervisor) {
            supervisor = await this.supervisorRepository.findOne({
              where: { id: memberId },
              relations: ['theirChurch'],
            });

            offeringIncome = await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: subType,
                category: category,
                memberType: memberType,
                supervisor: supervisor,
                date: new Date(date),
                currency: currency,
                recordStatus: RecordStatus.Active,
              },
            });
          }

          if (memberType === MemberType.Preacher) {
            preacher = await this.preacherRepository.findOne({
              where: { id: memberId },
              relations: ['theirChurch'],
            });

            offeringIncome = await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: subType,
                category: category,
                memberType: memberType,
                preacher: preacher,
                date: new Date(date),
                currency: currency,
                recordStatus: RecordStatus.Active,
              },
            });
          }

          if (memberType === MemberType.Disciple) {
            disciple = await this.discipleRepository.findOne({
              where: { id: memberId },
              relations: ['theirChurch'],
            });

            offeringIncome = await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: subType,
                category: category,
                memberType: memberType,
                disciple: disciple,
                date: new Date(date),
                currency: currency,
                recordStatus: RecordStatus.Active,
              },
            });
          }
        }

        if (offeringIncome.length > 0) {
          const offeringDate = dateFormatterToDDMMYYYY(
            new Date(date).getTime(),
          );

          if (category === OfferingIncomeCreationCategory.OfferingBox) {
            throw new NotFoundException(
              `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Iglesia: ${church.churchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]}, Divisa: ${currency}, Turno: ${OfferingIncomeCreationShiftTypeNames[shift]} y Fecha: ${offeringDate}.`,
            );
          }
          if (
            category === OfferingIncomeCreationCategory.Activities ||
            category === OfferingIncomeCreationCategory.ExternalDonation
          ) {
            throw new NotFoundException(
              `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Iglesia: ${church.churchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]}, Divisa: ${currency} y Fecha: ${offeringDate}.`,
            );
          }
          if (category === OfferingIncomeCreationCategory.InternalDonation) {
            throw new NotFoundException(
              `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Iglesia: ${church.churchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]}, Divisa: ${currency}, Tipo de miembro: ${MemberTypeNames[memberType]} (mismos nombres) y Fecha: ${offeringDate}.`,
            );
          }
        }

        if (
          subType === OfferingIncomeCreationSubType.SundaySchool &&
          category === OfferingIncomeCreationCategory.OfferingBox &&
          !shift
        ) {
          throw new NotFoundException(`El turno es requerido.`);
        }

        if (
          subType === OfferingIncomeCreationSubType.SundaySchool &&
          category === OfferingIncomeCreationCategory.OfferingBox &&
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
            pastor: pastor,
            copastor: copastor,
            supervisor: supervisor,
            preacher: preacher,
            disciple: disciple,
            church: church,
            zone: null,
            familyGroup: null,
            memberType: !memberType || memberType === '' ? null : memberType,
            category: category,
            shift: !shift || shift === '' ? null : shift,
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
        if (!churchId) {
          throw new NotFoundException(`La iglesia es requerida.`);
        }

        const church = await this.churchRepository.findOne({
          where: { id: churchId },
          relations: ['theirMainChurch'],
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id: ${churchId}, no fue encontrado.`,
          );
        }

        if (!church?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

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

        //* Validate if exists record already
        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            church: church,
            category: category,
            subType: subType,
            zone: zone,
            date: new Date(date),
            currency: currency,
            recordStatus: RecordStatus.Active,
          },
        });

        if (offeringsIncome.length > 0) {
          const offeringDate = dateFormatterToDDMMYYYY(
            new Date(date).getTime(),
          );

          throw new NotFoundException(
            `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Iglesia: ${church.churchName}, Divisa: ${currency} y Fecha: ${offeringDate}.`,
          );
        }

        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            church: church,
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

      //? General fasting, vigil, united service, activities
      if (
        subType === OfferingIncomeCreationSubType.GeneralVigil ||
        subType === OfferingIncomeCreationSubType.GeneralFasting ||
        subType === OfferingIncomeCreationSubType.UnitedService ||
        subType === OfferingIncomeCreationSubType.Activities
      ) {
        if (!churchId) {
          throw new NotFoundException(`La iglesia es requerida.`);
        }

        const church = await this.churchRepository.findOne({
          where: { id: churchId },
          relations: ['theirMainChurch'],
        });

        //* Validate if exists record already
        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            subType: subType,
            category: category,
            church: church,
            date: new Date(date),
            currency: currency,
            recordStatus: RecordStatus.Active,
          },
        });

        if (offeringsIncome.length > 0) {
          const offeringDate = dateFormatterToDDMMYYYY(
            new Date(date).getTime(),
          );

          throw new NotFoundException(
            `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Divisa: ${currency} y Fecha: ${offeringDate}.`,
          );
        }

        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            church: church,
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
    }

    //? Income adjustment
    if (type === OfferingIncomeCreationType.IncomeAdjustment) {
      if (!churchId) {
        throw new NotFoundException(`La iglesia es requerida.`);
      }

      const church = await this.churchRepository.findOne({
        where: { id: churchId },
        relations: ['theirMainChurch'],
      });

      if (!church) {
        throw new NotFoundException(
          `Iglesia con id: ${churchId}, no fue encontrado.`,
        );
      }

      if (!church?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }

      try {
        const newOfferingIncome = this.offeringIncomeRepository.create({
          ...createOfferingIncomeDto,
          amount: +amount,
          subType: null,
          church: church,
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

    try {
      const offeringsIncome = await this.offeringIncomeRepository.find({
        where: { recordStatus: RecordStatus.Active },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'church',
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

      if (offeringsIncome.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return offeringIncomeDataFormatter({ offeringsIncome }) as any;
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
      (searchType === OfferingIncomeSearchType.SundayService ||
        searchType === OfferingIncomeSearchType.SundaySchool ||
        searchType === OfferingIncomeSearchType.FamilyGroup ||
        searchType === OfferingIncomeSearchType.ZonalFasting ||
        searchType === OfferingIncomeSearchType.ZonalVigil ||
        searchType === OfferingIncomeSearchType.GeneralFasting ||
        searchType === OfferingIncomeSearchType.GeneralVigil ||
        searchType === OfferingIncomeSearchType.YouthService ||
        searchType === OfferingIncomeSearchType.UnitedService ||
        searchType === OfferingIncomeSearchType.Activities ||
        searchType === OfferingIncomeSearchType.Special ||
        searchType === OfferingIncomeSearchType.ChurchGround ||
        searchType === OfferingIncomeSearchType.IncomeAdjustment) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByDate
    ) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      try {
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        let offeringsIncome: OfferingIncome[];
        if (searchType !== OfferingIncomeSearchType.IncomeAdjustment) {
          offeringsIncome = await this.offeringIncomeRepository.find({
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
              'church',
              'zone',
              'pastor',
              'copastor',
              'supervisor',
              'preacher',
              'disciple',
            ],
            order: { createdAt: order as FindOptionsOrderValue },
          });
        }

        if (searchType === OfferingIncomeSearchType.IncomeAdjustment) {
          offeringsIncome = await this.offeringIncomeRepository.find({
            where: {
              type: searchType,
              date: Between(fromDate, toDate),
              recordStatus: RecordStatus.Active,
            },
            take: limit,
            skip: offset,
            relations: [
              'updatedBy',
              'createdBy',
              'familyGroup',
              'church',
              'zone',
              'pastor',
              'copastor',
              'supervisor',
              'preacher',
              'disciple',
            ],
            order: { createdAt: order as FindOptionsOrderValue },
          });
        }

        if (offeringsIncome.length === 0) {
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este rango de fechas: ${fromDate} - ${toDate}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Offerings others --> Many
    //* By church
    if (
      term &&
      (searchType === OfferingIncomeSearchType.SundayService ||
        searchType === OfferingIncomeSearchType.SundaySchool ||
        searchType === OfferingIncomeSearchType.GeneralFasting ||
        searchType === OfferingIncomeSearchType.GeneralVigil ||
        searchType === OfferingIncomeSearchType.YouthService ||
        searchType === OfferingIncomeSearchType.UnitedService ||
        searchType === OfferingIncomeSearchType.Activities ||
        searchType === OfferingIncomeSearchType.IncomeAdjustment) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByChurch
    ) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
          },
        });

        if (!church) {
          throw new NotFoundException(
            `No se encontró ninguna iglesia con este ID: ${term}.`,
          );
        }

        let offeringsIncome: OfferingIncome[];
        if (searchType !== OfferingIncomeSearchType.IncomeAdjustment) {
          offeringsIncome = await this.offeringIncomeRepository.find({
            where: {
              subType: searchType,
              church: church,
              recordStatus: RecordStatus.Active,
            },
            take: limit,
            skip: offset,
            relations: [
              'updatedBy',
              'createdBy',
              'familyGroup',
              'church',
              'zone',
              'pastor',
              'copastor',
              'supervisor',
              'preacher',
              'disciple',
            ],
            order: { createdAt: order as FindOptionsOrderValue },
          });
        }

        if (searchType === OfferingIncomeSearchType.IncomeAdjustment) {
          offeringsIncome = await this.offeringIncomeRepository.find({
            where: {
              type: searchType,
              church: church,
              recordStatus: RecordStatus.Active,
            },
            take: limit,
            skip: offset,
            relations: [
              'updatedBy',
              'createdBy',
              'familyGroup',
              'church',
              'zone',
              'pastor',
              'copastor',
              'supervisor',
              'preacher',
              'disciple',
            ],
            order: { createdAt: order as FindOptionsOrderValue },
          });
        }

        if (offeringsIncome.length === 0) {
          throw new NotFoundException(
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con esta iglesia: ${church?.churchName}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* By church and date
    if (
      term &&
      (searchType === OfferingIncomeSearchType.SundayService ||
        searchType === OfferingIncomeSearchType.SundaySchool ||
        searchType === OfferingIncomeSearchType.GeneralFasting ||
        searchType === OfferingIncomeSearchType.GeneralVigil ||
        searchType === OfferingIncomeSearchType.YouthService ||
        searchType === OfferingIncomeSearchType.UnitedService ||
        searchType === OfferingIncomeSearchType.Activities ||
        searchType === OfferingIncomeSearchType.IncomeAdjustment) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByChurchDate
    ) {
      const [churchId, date] = term.split('&');

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
          },
        });

        if (!church) {
          throw new NotFoundException(
            `No se encontró ninguna iglesia con este Id.`,
          );
        }

        const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        let offeringsIncome: OfferingIncome[];
        if (searchType !== OfferingIncomeSearchType.IncomeAdjustment) {
          offeringsIncome = await this.offeringIncomeRepository.find({
            where: {
              subType: searchType,
              church: church,
              date: Between(fromDate, toDate),
              recordStatus: RecordStatus.Active,
            },
            take: limit,
            skip: offset,
            relations: [
              'updatedBy',
              'createdBy',
              'familyGroup',
              'church',
              'zone',
              'pastor',
              'copastor',
              'supervisor',
              'preacher',
              'disciple',
            ],
            order: { createdAt: order as FindOptionsOrderValue },
          });
        }

        if (searchType === OfferingIncomeSearchType.IncomeAdjustment) {
          offeringsIncome = await this.offeringIncomeRepository.find({
            where: {
              type: searchType,
              church: church,
              date: Between(fromDate, toDate),
              recordStatus: RecordStatus.Active,
            },
            take: limit,
            skip: offset,
            relations: [
              'updatedBy',
              'createdBy',
              'familyGroup',
              'church',
              'zone',
              'pastor',
              'copastor',
              'supervisor',
              'preacher',
              'disciple',
            ],
            order: { createdAt: order as FindOptionsOrderValue },
          });
        }

        if (offeringsIncome.length === 0) {
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con esta iglesia: ${church?.churchName} y con este rango de fechas: ${fromDate} - ${toDate}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Offerings Sunday Service and Sunday School --> Many
    //* By shift
    if (
      term &&
      (searchType === OfferingIncomeSearchType.SundayService ||
        searchType === OfferingIncomeSearchType.SundaySchool) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByShift
    ) {
      const shiftTerm = term.toLowerCase();
      const validShifts = ['day', 'afternoon'];

      try {
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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este turno: ${shiftInSpanish}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* By shift and date
    if (
      term &&
      (searchType === OfferingIncomeSearchType.SundayService ||
        searchType === OfferingIncomeSearchType.SundaySchool) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByShiftDate
    ) {
      const [shift, date] = term.split('&');

      const shiftTerm = shift.toLowerCase();
      const validShifts = ['day', 'afternoon'];

      try {
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
            'church',
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
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          const shiftInSpanish =
            OfferingIncomeCreationShiftTypeNames[shiftTerm.toLowerCase()] ??
            term;

          throw new NotFoundException(
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este rango de fechas: ${fromDate} - ${toDate} y con este turno: ${shiftInSpanish}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Offerings Family Group --> Many
    //* By Zone
    if (
      term &&
      searchType === OfferingIncomeSearchType.FamilyGroup &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByZone
    ) {
      try {
        const zones = await this.zoneRepository.find({
          where: {
            zoneName: ILike(`%${term}%`),
          },
          relations: ['familyGroups'],
        });

        const familyGroupsByZone = zones
          .map((zone) => zone.familyGroups)
          .flat();

        const familyGroupsId = familyGroupsByZone.map(
          (familyGroup) => familyGroup?.id,
        );

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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con esta zona: ${term}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
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

      try {
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        const zones = await this.zoneRepository.find({
          where: {
            zoneName: ILike(`%${zone}%`),
          },
          relations: ['familyGroups'],
        });

        const familyGroupsByZone = zones
          .map((zone) => zone?.familyGroups)
          .flat();

        const familyGroupsId = familyGroupsByZone.map(
          (familyGroup) => familyGroup.id,
        );

        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            subType: searchType,
            date: Between(fromDate, toDate),
            familyGroup: In(familyGroupsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'familyGroup',
            'church',
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
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este rango de fechas: ${fromDate} - ${toDate} y esta zona: ${zone}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* By Group Code
    if (
      term &&
      searchType === OfferingIncomeSearchType.FamilyGroup &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByGroupCode
    ) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
          where: {
            familyGroupCode: ILike(`%${term}%`),
          },
        });

        const familyGroupsId = familyGroups.map(
          (familyGroup) => familyGroup?.id,
        );

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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con esta código de grupo familiar: ${term}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
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

      try {
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        const familyGroups = await this.familyGroupRepository.find({
          where: {
            familyGroupCode: ILike(`%${code}%`),
          },
        });

        const familyGroupsId = familyGroups.map(
          (familyGroup) => familyGroup?.id,
        );

        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            subType: searchType,
            date: Between(fromDate, toDate),
            familyGroup: In(familyGroupsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'familyGroup',
            'church',
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
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este rango de fechas: ${fromDate} - ${toDate} y este código de grupo: ${code}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* By Preacher names
    if (
      term &&
      searchType === OfferingIncomeSearchType.FamilyGroup &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByPreacherNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const preachers = await this.preacherRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
          },
          relations: ['theirFamilyGroup'],
        });

        const familyGroupsId = preachers.map(
          (preacher) => preacher?.theirFamilyGroup?.id,
        );

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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con estos nombres de predicador: ${firstNames}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* By Preacher last names
    if (
      term &&
      searchType === OfferingIncomeSearchType.FamilyGroup &&
      searchSubType === OfferingIncomeSearchSubType.OfferingByPreacherLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const preachers = await this.preacherRepository.find({
          where: {
            lastName: ILike(`%${lastNames}%`),
          },
          relations: ['theirFamilyGroup'],
        });

        const familyGroupsId = preachers.map(
          (preacher) => preacher?.theirFamilyGroup?.id,
        );

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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con estos apellidos de predicador: ${lastNames}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
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

      try {
        const preachers = await this.preacherRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            lastName: ILike(`%${lastNames}%`),
          },
          relations: ['theirFamilyGroup'],
        });

        const familyGroupsId = preachers.map((preacher) => preacher?.id);

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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con estos nombres y apellidos de predicador: ${firstNames} ${lastNames}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
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
      try {
        const zones = await this.zoneRepository.find({
          where: {
            zoneName: ILike(`%${term}%`),
          },
        });

        const zonesId = zones.map((zone) => zone?.id);

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
            'church',
            'zone',
            'pastor',
            'copastor',
            'supervisor',
            'preacher',
            'disciple',
          ],
        });

        if (offeringsIncome.length === 0) {
          throw new NotFoundException(
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con esta zona: ${term}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
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

      try {
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        const zones = await this.zoneRepository.find({
          where: {
            zoneName: ILike(`%${zone}%`),
          },
        });

        const zonesId = zones.map((zone) => zone?.id);

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
            'church',
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
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este rango de fechas: ${fromDate} - ${toDate} y esta zona: ${zone}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
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

      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
          },
          relations: ['theirZone'],
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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con estos  nombres de supervisor: ${firstNames}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
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

      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            lastName: ILike(`%${lastNames}%`),
          },
          relations: ['theirZone'],
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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con estos apellidos de supervisor: ${lastNames}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* By Supervisor full names
    if (
      term &&
      (searchType === OfferingIncomeSearchType.ZonalFasting ||
        searchType === OfferingIncomeSearchType.ZonalVigil) &&
      searchSubType === OfferingIncomeSearchSubType.OfferingBySupervisorFullName
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            firstName: ILike(`%${firstNames}%`),
            lastName: ILike(`%${lastNames}%`),
          },
          relations: ['theirZone'],
        });

        const zonesId = supervisors.map((supervisor) => supervisor?.id);

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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con estos nombres y apellidos de supervisor: ${firstNames} ${lastNames}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
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

      try {
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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este tipo de miembro: ${memberTypeInSpanish} y estos nombres: ${firstNames}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* By contributor last names
    if (
      term &&
      (searchType === OfferingIncomeSearchType.Special ||
        searchType === OfferingIncomeSearchType.ChurchGround) &&
      searchSubType ===
        OfferingIncomeSearchSubType.OfferingByContributorLastNames
    ) {
      const [memberType, names] = term.split('&');

      const lastNames = names.replace(/\+/g, ' ');

      try {
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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este tipo de miembro: ${memberTypeInSpanish} y estos apellidos: ${lastNames}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* By contributor full names
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

      try {
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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este tipo de miembro: ${memberTypeInSpanish} y estos nombres y apellidos: ${firstNames} ${lastNames}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    // ? Offerings by status --> Many
    if (term && searchType === OfferingIncomeSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      try {
        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
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
            'church',
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
            `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este estado de registro: ${value}`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? BAR CHARTS OFFERINGS
    //* Last Sunday Offerings
    if (term && searchType === DashboardSearchType.LastSundaysOfferings) {
      const [dateTerm, churchId] = term.split('&');

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) {
          throw new NotFoundException(
            `No se encontró ninguna iglesia con este ID ${term}.`,
          );
        }

        const timeZone = 'America/Lima';
        const sundays = [];
        const newDate = new Date(dateTerm);
        const zonedDate = toZonedTime(newDate, timeZone);

        zonedDate.setDate(
          newDate.getDay() === 6
            ? zonedDate.getDate()
            : zonedDate.getDate() - (zonedDate.getDay() + 1),
        ); // Domingo mas cercano

        for (let i = 0; i < 14; i++) {
          sundays.push(zonedDate.toISOString().split('T')[0]);
          zonedDate.setDate(zonedDate.getDate() - 7);
        }

        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            subType: OfferingIncomeSearchType.SundayService,
            date: In(sundays),
            church: church,
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'familyGroup',
            'zone',
            'church',
            'pastor',
            'copastor',
            'supervisor',
            'preacher',
            'disciple',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return lastSundayOfferingsDataFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Top Family groups Offerings
    if (term && searchType === DashboardSearchType.TopFamilyGroupsOfferings) {
      const [year, churchId] = term.split('&');

      try {
        const currentYear = year;
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) {
          throw new NotFoundException(
            `No se encontró ninguna iglesia con este Id.`,
          );
        }

        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            subType: OfferingIncomeSearchType.FamilyGroup,
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'familyGroup',
            'familyGroup.theirChurch',
            'familyGroup.theirPreacher',
            'familyGroup.disciples',
            'zone',
            'church',
            'pastor',
            'copastor',
            'supervisor',
            'preacher',
            'disciple',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const filteredOfferingsByRecordStatus = offeringsIncome.filter(
          (offeringIncome) =>
            offeringIncome.familyGroup?.recordStatus === RecordStatus.Active,
        );

        const filteredOfferingsByChurch =
          filteredOfferingsByRecordStatus.filter(
            (offeringIncome) =>
              offeringIncome.familyGroup?.theirChurch?.id === church?.id,
          );

        const filteredOfferingsIncomeByCurrentYear =
          filteredOfferingsByChurch.filter((offeringIncome) => {
            const year = new Date(offeringIncome.date).getFullYear();
            return year === +currentYear;
          });

        return topOfferingsFamilyGroupsDataFormatter({
          offeringsIncome: filteredOfferingsIncomeByCurrentYear,
        }) as any;
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
      (OfferingIncomeSearchType.SundayService ||
        OfferingIncomeSearchType.SundaySchool ||
        OfferingIncomeSearchType.FamilyGroup ||
        OfferingIncomeSearchType.ZonalFasting ||
        OfferingIncomeSearchType.ZonalVigil ||
        OfferingIncomeSearchType.GeneralFasting ||
        OfferingIncomeSearchType.GeneralVigil ||
        OfferingIncomeSearchType.YouthService ||
        OfferingIncomeSearchType.UnitedService ||
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

  //* UPDATE OFFERING INCOME
  async update(
    id: string,
    updateOfferingIncomeDto: UpdateOfferingIncomeDto,
    user: User,
  ) {
    const {
      date,
      type,
      shift,
      amount,
      zoneId,
      subType,
      churchId,
      memberId,
      currency,
      imageUrls,
      memberType,
      recordStatus,
      familyGroupId,
    } = updateOfferingIncomeDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    //* Validations
    const offeringIncome = await this.offeringIncomeRepository.findOne({
      where: { id: id },
      relations: [
        'church',
        'zone',
        'familyGroup',
        'pastor',
        'copastor',
        'supervisor',
        'preacher',
        'disciple',
      ],
    });

    if (!offeringIncome) {
      throw new NotFoundException(
        `Ingreso de Ofrenda con id: ${id} no fue encontrado`,
      );
    }

    if (
      offeringIncome?.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }

    if (type && type !== offeringIncome?.type) {
      throw new BadRequestException(
        `No se puede actualizar el tipo de este registro.`,
      );
    }

    if (subType && subType !== offeringIncome?.subType) {
      throw new BadRequestException(
        `No se puede actualizar el sub-tipo de este registro.`,
      );
    }

    if (shift && shift !== offeringIncome?.shift) {
      throw new BadRequestException(
        `No se puede actualizar el turno de este registro.`,
      );
    }

    if (memberType && memberType !== offeringIncome?.memberType) {
      throw new BadRequestException(
        `No se puede actualizar el tipo de miembro de este registro.`,
      );
    }

    if (churchId && churchId !== offeringIncome?.church?.id) {
      throw new BadRequestException(
        `No se puede actualizar la Iglesia a la que pertenece este registro.`,
      );
    }

    if (familyGroupId && familyGroupId !== offeringIncome?.familyGroup?.id) {
      throw new BadRequestException(
        `No se puede actualizar el Grupo Familiar al que pertenece este registro.`,
      );
    }

    if (zoneId && zoneId !== offeringIncome?.zone?.id) {
      throw new BadRequestException(
        `No se puede actualizar la Zona al  que pertenece este registro.`,
      );
    }

    if (
      memberType === MemberType.Disciple &&
      memberId !== offeringIncome?.disciple?.id
    ) {
      throw new BadRequestException(
        `No se puede actualizar el Discípulo que pertenece este registro.`,
      );
    }

    if (
      memberType === MemberType.Pastor &&
      memberId !== offeringIncome?.pastor?.id
    ) {
      throw new BadRequestException(
        `No se puede actualizar el Pastor que pertenece este registro.`,
      );
    }

    if (
      memberType === MemberType.Copastor &&
      memberId !== offeringIncome?.copastor?.id
    ) {
      throw new BadRequestException(
        `No se puede actualizar el Co-Pastor que pertenece este registro.`,
      );
    }

    if (
      memberType === MemberType.Supervisor &&
      memberId !== offeringIncome?.supervisor?.id
    ) {
      throw new BadRequestException(
        `No se puede actualizar el Supervisor que pertenece este registro.`,
      );
    }

    if (
      memberType === MemberType.Preacher &&
      memberId !== offeringIncome?.preacher?.id
    ) {
      throw new BadRequestException(
        `No se puede actualizar el Predicador que pertenece este registro.`,
      );
    }

    try {
      //? Validate if exists record already
      const zone = await this.zoneRepository.findOne({
        where: {
          id: zoneId,
        },
      });

      const familyGroup = await this.familyGroupRepository.findOne({
        where: {
          id: familyGroupId,
        },
      });

      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
        },
      });

      let memberValue: Pastor | Copastor | Supervisor | Preacher | Disciple;
      if (memberType === MemberType.Pastor) {
        memberValue = await this.pastorRepository.findOne({
          where: {
            id: memberId,
          },
        });
      }
      if (memberType === MemberType.Copastor) {
        memberValue = await this.copastorRepository.findOne({
          where: {
            id: memberId,
          },
        });
      }
      if (memberType === MemberType.Supervisor) {
        memberValue = await this.supervisorRepository.findOne({
          where: {
            id: memberId,
          },
        });
      }
      if (memberType === MemberType.Preacher) {
        memberValue = await this.preacherRepository.findOne({
          where: {
            id: memberId,
          },
        });
      }
      if (memberType === MemberType.Disciple) {
        memberValue = await this.discipleRepository.findOne({
          where: {
            id: memberId,
          },
        });
      }

      let offeringsIncome: OfferingIncome[];

      //* Sunday school and sunday service
      if (
        subType === OfferingIncomeCreationSubType.SundaySchool ||
        subType === OfferingIncomeCreationSubType.SundayService
      ) {
        offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            church: church,
            date: new Date(date),
            currency: currency,
            shift: shift,
            recordStatus: RecordStatus.Active,
          },
        });
      }

      //* Family group
      if (subType === OfferingIncomeCreationSubType.FamilyGroup) {
        offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            date: new Date(date),
            currency: currency,
            familyGroup: familyGroup,
            recordStatus: RecordStatus.Active,
          },
        });
      }

      //* Zonal fasting and vigil
      if (
        subType === OfferingIncomeCreationSubType.ZonalVigil ||
        subType === OfferingIncomeCreationSubType.ZonalFasting
      ) {
        offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            date: new Date(date),
            currency: currency,
            zone: zone,
            recordStatus: RecordStatus.Active,
          },
        });
      }

      //* General fasting, general vigil, youth service, united services, activities
      if (
        subType === OfferingIncomeCreationSubType.GeneralFasting ||
        subType === OfferingIncomeCreationSubType.GeneralVigil ||
        subType === OfferingIncomeCreationSubType.YouthService ||
        subType === OfferingIncomeCreationSubType.UnitedService ||
        subType === OfferingIncomeCreationSubType.Activities
      ) {
        offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            date: new Date(date),
            church: church,
            currency: currency,
            recordStatus: RecordStatus.Active,
          },
        });
      }

      //* Special and church ground
      if (
        subType === OfferingIncomeCreationSubType.Special ||
        subType === OfferingIncomeCreationSubType.ChurchGround
      ) {
        if (memberType === MemberType.Pastor) {
          offeringsIncome = await this.offeringIncomeRepository.find({
            where: {
              id: Not(id),
              type: type,
              subType: subType,
              date: new Date(date),
              currency: currency,
              memberType: memberType,
              pastor: memberValue as Pastor,
              recordStatus: RecordStatus.Active,
            },
          });
        }
        if (memberType === MemberType.Copastor) {
          offeringsIncome = await this.offeringIncomeRepository.find({
            where: {
              id: Not(id),
              type: type,
              subType: subType,
              date: new Date(date),
              currency: currency,
              memberType: memberType,
              copastor: memberValue as Copastor,
              recordStatus: RecordStatus.Active,
            },
          });
        }
        if (memberType === MemberType.Supervisor) {
          offeringsIncome = await this.offeringIncomeRepository.find({
            where: {
              id: Not(id),
              type: type,
              subType: subType,
              date: new Date(date),
              currency: currency,
              memberType: memberType,
              supervisor: memberValue as Supervisor,
              disciple: memberValue as Disciple,
              recordStatus: RecordStatus.Active,
            },
          });
        }
        if (memberType === MemberType.Preacher) {
          offeringsIncome = await this.offeringIncomeRepository.find({
            where: {
              id: Not(id),
              type: type,
              subType: subType,
              date: new Date(date),
              currency: currency,
              memberType: memberType,
              preacher: memberValue as Preacher,
              recordStatus: RecordStatus.Active,
            },
          });
        }
        if (memberType === MemberType.Disciple) {
          offeringsIncome = await this.offeringIncomeRepository.find({
            where: {
              id: Not(id),
              type: type,
              subType: subType,
              date: new Date(date),
              currency: currency,
              memberType: memberType,
              disciple: memberValue as Disciple,
              recordStatus: RecordStatus.Active,
            },
          });
        }
      }

      //* Income adjustment
      if (type === OfferingIncomeCreationType.IncomeAdjustment) {
        offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            date: new Date(date),
            currency: currency,
            memberType: memberType ?? IsNull(),
            pastor: (memberValue as Pastor) ?? IsNull(),
            copastor: (memberValue as Copastor) ?? IsNull(),
            supervisor: (memberValue as Supervisor) ?? IsNull(),
            preacher: (memberValue as Preacher) ?? IsNull(),
            disciple: (memberValue as Disciple) ?? IsNull(),
            recordStatus: RecordStatus.Active,
          },
        });
      }

      if (offeringsIncome.length > 0) {
        const newDate = dateFormatterToDDMMYYYY(new Date(date).getTime());

        throw new NotFoundException(
          `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Divisa: ${currency} y Fecha: ${newDate}.\nSi desea hacer cambio de divisa, debe hacerlo desde el modulo Eliminar Ingreso.`,
        );
      }

      const updatedOfferingIncome = await this.offeringIncomeRepository.preload(
        {
          id: offeringIncome?.id,
          ...updateOfferingIncomeDto,
          shift: shift === '' ? null : shift,
          memberType: !memberType ? null : memberType,
          amount: +amount,
          imageUrls: [...offeringIncome.imageUrls, ...imageUrls],
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        },
      );

      return await this.offeringIncomeRepository.save(updatedOfferingIncome);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //! DELETE OFFERING INCOME
  async remove(
    id: string,
    deleteOfferingIncomeDto: DeleteOfferingDto,
    user: User,
  ): Promise<void> {
    const { reasonEliminationType, exchangeRate, exchangeCurrencyType } =
      deleteOfferingIncomeDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const offeringIncome = await this.offeringIncomeRepository.findOne({
      where: { id: id },
      relations: [
        'church',
        'zone',
        'familyGroup',
        'pastor',
        'copastor',
        'supervisor',
        'preacher',
        'disciple',
      ],
    });

    if (!offeringIncome) {
      throw new NotFoundException(
        `Ingreso de Ofrenda con id: ${id} no fue encontrado.`,
      );
    }

    //? Actualizar ofrenda de destino con el monto convertido
    try {
      if (
        reasonEliminationType === OfferingReasonEliminationType.CurrencyExchange
      ) {
        let offeringDestiny: OfferingIncome;

        if (
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.SundayService ||
          offeringIncome.subType === OfferingIncomeCreationSubType.SundaySchool
        ) {
          offeringDestiny = await this.offeringIncomeRepository.findOne({
            where: {
              type: offeringIncome.type,
              subType: offeringIncome.subType,
              date: offeringIncome.date,
              church: offeringIncome.church,
              shift: offeringIncome.shift,
              currency:
                (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
                  exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
                CurrencyType.PEN,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (
          offeringIncome.subType === OfferingIncomeCreationSubType.FamilyGroup
        ) {
          offeringDestiny = await this.offeringIncomeRepository.findOne({
            where: {
              type: offeringIncome.type,
              subType: offeringIncome.subType,
              date: offeringIncome.date,
              familyGroup: offeringIncome.familyGroup,
              currency:
                (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
                  exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
                CurrencyType.PEN,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ZonalFasting ||
          offeringIncome.subType === OfferingIncomeCreationSubType.ZonalVigil
        ) {
          offeringDestiny = await this.offeringIncomeRepository.findOne({
            where: {
              type: offeringIncome.type,
              subType: offeringIncome.subType,
              date: offeringIncome.date,
              zone: offeringIncome.zone,
              currency:
                (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
                  exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
                CurrencyType.PEN,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.GeneralFasting ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.GeneralVigil ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.UnitedService ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.YouthService ||
          offeringIncome.subType === OfferingIncomeCreationSubType.Activities
        ) {
          offeringDestiny = await this.offeringIncomeRepository.findOne({
            where: {
              type: offeringIncome.type,
              subType: offeringIncome.subType,
              date: offeringIncome.date,
              church: offeringIncome.church,
              currency:
                (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
                  exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
                CurrencyType.PEN,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ChurchGround ||
          offeringIncome.subType === OfferingIncomeCreationSubType.Special
        ) {
          if (offeringIncome.memberType === MemberType.Pastor) {
            offeringDestiny = await this.offeringIncomeRepository.findOne({
              where: {
                type: offeringIncome.type,
                subType: offeringIncome.subType,
                date: offeringIncome.date,
                memberType: offeringIncome.memberType,
                pastor: offeringIncome.pastor,
                currency:
                  (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
                    exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
                  CurrencyType.PEN,
                recordStatus: RecordStatus.Active,
              },
            });
          }
          if (offeringIncome.memberType === MemberType.Copastor) {
            offeringDestiny = await this.offeringIncomeRepository.findOne({
              where: {
                type: offeringIncome.type,
                subType: offeringIncome.subType,
                date: offeringIncome.date,
                memberType: offeringIncome.memberType,
                copastor: offeringIncome.copastor,
                currency:
                  (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
                    exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
                  CurrencyType.PEN,
                recordStatus: RecordStatus.Active,
              },
            });
          }
          if (offeringIncome.memberType === MemberType.Supervisor) {
            offeringDestiny = await this.offeringIncomeRepository.findOne({
              where: {
                type: offeringIncome.type,
                subType: offeringIncome.subType,
                date: offeringIncome.date,
                memberType: offeringIncome.memberType,
                supervisor: offeringIncome.supervisor,
                currency:
                  (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
                    exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
                  CurrencyType.PEN,
                recordStatus: RecordStatus.Active,
              },
            });
          }
          if (offeringIncome.memberType === MemberType.Preacher) {
            offeringDestiny = await this.offeringIncomeRepository.findOne({
              where: {
                type: offeringIncome.type,
                subType: offeringIncome.subType,
                date: offeringIncome.date,
                memberType: offeringIncome.memberType,
                preacher: offeringIncome.preacher,
                currency:
                  (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
                    exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
                  CurrencyType.PEN,
                recordStatus: RecordStatus.Active,
              },
            });
          }
          if (offeringIncome.memberType === MemberType.Disciple) {
            offeringDestiny = await this.offeringIncomeRepository.findOne({
              where: {
                type: offeringIncome.type,
                subType: offeringIncome.subType,
                date: offeringIncome.date,
                memberType: offeringIncome.memberType,
                disciple: offeringIncome.disciple,
                currency:
                  (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
                    exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
                  CurrencyType.PEN,
                recordStatus: RecordStatus.Active,
              },
            });
          }
        }

        //* Si existe, se suma el monto transformado al registro existente.
        if (offeringDestiny) {
          const currentComments = offeringDestiny.comments || '';
          const newComments = `💲 Monto anterior: ${offeringDestiny.amount} ${offeringDestiny.currency}\n💲 Monto añadido: ${(offeringIncome.amount * +exchangeRate).toFixed(2)} ${offeringDestiny.currency} (${offeringIncome.amount} ${offeringIncome.currency})\n💰Tipo de cambio (precio): ${exchangeRate}`;
          const updatedComments = currentComments
            ? `${currentComments}\n\n${newComments}`
            : `${newComments}`;

          const updatedOffering = await this.offeringIncomeRepository.preload({
            id: offeringDestiny.id,
            comments: updatedComments,
            amount: parseFloat(
              (
                +offeringDestiny.amount +
                offeringIncome.amount * +exchangeRate
              ).toFixed(2),
            ),
            updatedAt: new Date(),
            updatedBy: user,
          });

          await this.offeringIncomeRepository.save(updatedOffering);
        }

        //* Si no existe un registro a donde aumentar el cambio, se crea.
        if (!offeringDestiny) {
          const newComments = `💲 Monto convertido: ${(+offeringIncome.amount * +exchangeRate).toFixed(2)} ${
            (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
              exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
            CurrencyType.PEN
          } (${offeringIncome.amount} ${offeringIncome?.currency})\n💰Tipo de cambio (precio): ${exchangeRate}`;

          offeringDestiny = this.offeringIncomeRepository.create({
            type: offeringIncome.type,
            subType: offeringIncome.subType,
            amount: parseFloat(
              (offeringIncome.amount * +exchangeRate).toFixed(2),
            ),
            currency:
              (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
                exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
              CurrencyType.PEN,
            date: offeringIncome.date,
            comments: newComments,
            church: offeringIncome.church,
            pastor: offeringIncome.pastor,
            copastor: offeringIncome.copastor,
            supervisor: offeringIncome.supervisor,
            preacher: offeringIncome.preacher,
            disciple: offeringIncome.disciple,
            zone: offeringIncome.zone,
            memberType: offeringIncome.memberType,
            shift: offeringIncome.shift,
            imageUrls: offeringIncome.imageUrls,
            familyGroup: offeringIncome.familyGroup,
            createdAt: new Date(),
            createdBy: user,
          });

          await this.offeringIncomeRepository.save(offeringDestiny);
        }
      }

      //* Update and set in Inactive and info comments on Offering Income
      const existingComments = offeringIncome.comments || '';
      const exchangeRateComments = `Tipo de cambio(precio): ${exchangeRate}\nTipo de cambio(moneda): ${ExchangeCurrencyTypeNames[exchangeCurrencyType]}\nTotal monto cambiado: ${(offeringIncome.amount * +exchangeRate).toFixed(2)} ${
        (exchangeCurrencyType === ExchangeCurrencyType.USDtoPEN ||
          exchangeCurrencyType === ExchangeCurrencyType.EURtoPEN) &&
        CurrencyType.PEN
      }`;
      const removalInfoComments: string = `Fecha de eliminación: ${format(new Date(), 'dd/MM/yyyy')}\nMotivo de eliminación: ${OfferingReasonEliminationTypeNames[reasonEliminationType as OfferingReasonEliminationType]}\nUsuario: ${user.firstName} ${user.lastName}`;

      const updatedComments =
        exchangeRate && exchangeCurrencyType && existingComments
          ? `${existingComments}\n\n${exchangeRateComments}\n\n${removalInfoComments}`
          : exchangeRate && exchangeCurrencyType && !existingComments
            ? `${exchangeRateComments}\n\n${removalInfoComments}`
            : !exchangeRate && !exchangeCurrencyType && existingComments
              ? `${existingComments}\n\n${removalInfoComments}`
              : `${removalInfoComments}`;

      const deletedOfferingIncome = await this.offeringIncomeRepository.preload(
        {
          id: offeringIncome.id,
          comments: updatedComments,
          reasonElimination: reasonEliminationType,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: RecordStatus.Inactive,
        },
      );

      await this.offeringIncomeRepository.save(deletedOfferingIncome);
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
