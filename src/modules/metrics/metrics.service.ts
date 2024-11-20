import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, In, Repository } from 'typeorm';

import { endOfMonth, startOfMonth } from 'date-fns';

import { RecordStatus } from '@/common/enums';
import { SearchAndPaginationDto } from '@/common/dtos';

import { MetricSearchType } from '@/modules/metrics/enums';

import {
  IncomeAndExpensesComparativeFormatter,
  comparativeOfferingIncomeByTypeFormatter,
  generalComparativeOfferingIncomeFormatter,
  comparativeOfferingExpensesByTypeFormatter,
  generalComparativeOfferingExpensesFormatter,
  ComparativeOfferingExpensesBySubTypeFormatter,
  offeringExpensesAndOfferingIncomeProportionFormatter,
} from '@/modules/metrics/helpers/offering-comparative';

import {
  offeringExpenseChartFormatter,
  offeringExpenseProportionFormatter,
  offeringExpensesAdjustmentFormatter,
} from '@/modules/metrics/helpers/offering-expense';

import {
  offeringIncomeProportionFormatter,
  offeringIncomeByActivitiesFormatter,
  offeringIncomeByFamilyGroupFormatter,
  offeringIncomeByYouthServiceFormatter,
  offeringIncomeBySundaySchoolFormatter,
  offeringIncomeByChurchGroundFormatter,
  offeringIncomeBySundayServiceFormatter,
  offeringIncomeByUnitedServiceFormatter,
  offeringIncomeByFastingAndVigilFormatter,
  offeringIncomeBySpecialOfferingFormatter,
  offeringIncomeByIncomeAdjustmentFormatter,
} from '@/modules/metrics/helpers/offering-income';

import {
  memberProportionFormatter,
  memberFormatterByCategory,
  memberFluctuationFormatter,
  memberFormatterByBirthMonth,
  memberFormatterByRecordStatus,
  memberFormatterByMaritalStatus,
  memberFormatterByZoneAndGender,
  memberFormatterByRoleAndGender,
  preacherFormatterByZoneAndGender,
  memberFormatterByCategoryAndGender,
  memberFormatterByDistrictAndGender,
} from '@/modules/metrics/helpers/member';

import {
  familyGroupFormatterByZone,
  familyGroupFormatterByCode,
  familyGroupFormatterByDistrict,
  familyGroupProportionFormatter,
  familyGroupFluctuationFormatter,
  familyGroupFormatterByServiceTime,
  familyGroupFormatterByRecordStatus,
} from '@/modules/metrics/helpers/family-group';

import {
  OfferingIncomeSearchType,
  OfferingIncomeCreationType,
} from '@/modules/offering/income/enums';
import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums';

import { Zone } from '@/modules/zone/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';
import { OfferingIncome } from '@/modules/offering/income/entities';
import { OfferingExpense } from '@/modules/offering/expense/entities';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger('MetricsService');

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

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,

    @InjectRepository(FamilyGroup)
    private readonly familyGroupRepository: Repository<FamilyGroup>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    @InjectRepository(OfferingExpense)
    private readonly offeringExpenseRepository: Repository<OfferingExpense>,
  ) {}

  //? FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<any> {
    const {
      'search-type': searchType,
      order = 'DESC',
      allZones,
      allFamilyGroups,
      allDistricts,
      isSingleMonth,
    } = searchTypeAndPaginationDto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido.`);
    }

    //? MEMBER METRICS
    //* Members Proportion
    if (term && searchType === MetricSearchType.MembersByProportion) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church },
              order: {
                createdAt: order as FindOptionsOrderValue,
              },
              relations: ['member'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
          ]);

        return memberProportionFormatter({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members fluctuation analysis by year
    if (term && searchType === MetricSearchType.MembersFluctuationByYear) {
      const [churchId, yearValue] = term.split('&');
      const year = +yearValue;

      const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      // New
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const newMembers = await Promise.all([
          this.pastorRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.copastorRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.supervisorRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.preacherRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.discipleRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
        ]);

        // Inactive
        const inactiveMembers = await Promise.all([
          this.pastorRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.copastorRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.supervisorRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.preacherRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.discipleRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
        ]);

        return memberFluctuationFormatter({
          newMembers,
          inactiveMembers,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by birth month
    if (term && searchType === MetricSearchType.MembersByBirthMonth) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByBirthMonth({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by category
    if (term && searchType === MetricSearchType.MembersByCategory) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
          ]);

        return memberFormatterByCategory({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by category and gender
    if (term && searchType === MetricSearchType.MembersByCategoryAndGender) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByCategoryAndGender({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by role and gender
    if (term && searchType === MetricSearchType.MembersByRoleAndGender) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByRoleAndGender({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by marital status
    if (term && searchType === MetricSearchType.MembersByMaritalStatus) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByMaritalStatus({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by zone and gender
    if (term && searchType === MetricSearchType.MembersByZoneAndGender) {
      const [churchId, copastorId] = term.split('&');

      if (!allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastor = await this.copastorRepository.findOne({
            where: {
              id: copastorId,
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'zones'],
          });

          const zonesId = copastor?.zones?.map((zone) => zone?.id);

          const zones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'disciples.member',
            ],
          });

          return memberFormatterByZoneAndGender({
            zones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastors = await this.copastorRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'zones'],
          });

          const zonesByCopastor = copastors
            .map((copastor) => copastor?.zones)
            .flat();

          const zonesId = zonesByCopastor.map((zone) => zone?.id);

          const allZones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'disciples.member',
            ],
          });

          return memberFormatterByZoneAndGender({
            zones: allZones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Preachers analysis by zone and gender
    if (term && searchType === MetricSearchType.PreachersByZoneAndGender) {
      const [churchId, copastorId] = term.split('&');

      if (!allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastor = await this.copastorRepository.findOne({
            where: {
              id: copastorId,
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'zones'],
          });

          const zonesId = copastor.zones.map((zone) => zone?.id);

          const zones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'preachers.member',
            ],
          });

          return preacherFormatterByZoneAndGender({
            zones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastors = await this.copastorRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'zones'],
          });

          const zonesByCopastor = copastors
            .map((copastor) => copastor?.zones)
            .flat();

          const zonesId = zonesByCopastor.map((zone) => zone?.id);

          const allZones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'preachers.member',
            ],
          });

          return preacherFormatterByZoneAndGender({
            zones: allZones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Members analysis by district and gender
    if (term && searchType === MetricSearchType.MembersByDistrictAndGender) {
      const [churchId, district] = term.split('&');

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: {
                theirChurch: church,
                member: {
                  district: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: {
                theirChurch: church,
                member: {
                  district: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: {
                theirChurch: church,
                member: {
                  district: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: {
                theirChurch: church,
                member: {
                  district: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: {
                theirChurch: church,
                member: {
                  district: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByDistrictAndGender({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by record status
    if (term && searchType === MetricSearchType.MembersByRecordStatus) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: {
                theirChurch: church,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: {
                theirChurch: church,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByRecordStatus({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? FAMILY GROUP METRICS
    //* Family groups Proportion
    if (term && searchType === MetricSearchType.FamilyGroupsByProportion) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const familyGroups = await this.familyGroupRepository.find({
          where: { theirChurch: church },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return familyGroupProportionFormatter({
          familyGroups,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Family groups fluctuation by year
    if (term && searchType === MetricSearchType.FamilyGroupsFluctuationByYear) {
      const [churchId, valueYear] = term.split('&');
      const year = +valueYear;

      const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        // New
        const activeFamilyGroups = await this.familyGroupRepository.find({
          where: {
            theirChurch: church,
            createdAt: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: ['theirChurch'],
        });

        // Inactive
        const inactiveFamilyGroups = await this.familyGroupRepository.find({
          where: {
            theirChurch: church,
            updatedAt: Between(startDate, endDate),
            recordStatus: RecordStatus.Inactive,
          },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: ['theirChurch'],
        });

        return familyGroupFluctuationFormatter({
          activeFamilyGroups,
          inactiveFamilyGroups,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Family Groups by code
    if (term && searchType === MetricSearchType.FamilyGroupsByCode) {
      const [churchId, zoneId] = term.split('&');

      if (!allFamilyGroups) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const zone = await this.zoneRepository.findOne({
            where: {
              id: zoneId,
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            relations: ['familyGroups'],
          });

          const familyGroupsId = zone.familyGroups.map(
            (familyGroup) => familyGroup?.id,
          );

          const familyGroups = await this.familyGroupRepository.find({
            where: {
              id: In(familyGroupsId),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: [
              'theirPreacher.member',
              'theirChurch',
              'disciples.member',
            ],
          });

          return familyGroupFormatterByCode({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allFamilyGroups) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const zones = await this.zoneRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            relations: ['familyGroups'],
          });

          const familyGroupsByZone = zones
            .map((zone) => zone.familyGroups)
            .flat();

          const familyGroupsId = familyGroupsByZone.map(
            (familyGroup) => familyGroup.id,
          );

          const familyGroups = await this.familyGroupRepository.find({
            where: {
              id: In(familyGroupsId),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: [
              'theirPreacher.member',
              'theirChurch',
              'disciples.member',
            ],
          });

          return familyGroupFormatterByCode({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Family Groups by zone
    if (term && searchType === MetricSearchType.FamilyGroupsByZone) {
      const [churchId, copastorId] = term.split('&');

      if (!allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastor = await this.copastorRepository.findOne({
            where: {
              id: copastorId,
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['zones'],
          });

          const zonesId = copastor.zones.map((zone) => zone?.id);

          const zones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'familyGroups',
            ],
          });

          return familyGroupFormatterByZone({
            zones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastors = await this.copastorRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['zones'],
          });

          const zonesByCopastor = copastors
            .map((copastor) => copastor?.zones)
            .flat();

          const zonesId = zonesByCopastor.map((zone) => zone?.id);

          const allZones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'familyGroups',
            ],
          });

          return familyGroupFormatterByZone({
            zones: allZones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Family groups analysis by district
    if (term && searchType === MetricSearchType.FamilyGroupsByDistrict) {
      const [churchId, district] = term.split('&');

      if (!allDistricts) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const familyGroups = await this.familyGroupRepository.find({
            where: {
              theirChurch: church,
              district: district,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['theirChurch'],
          });

          return familyGroupFormatterByDistrict({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allDistricts) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const familyGroups = await this.familyGroupRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['theirChurch'],
          });

          return familyGroupFormatterByDistrict({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Family Groups analysis by service time
    if (term && searchType === MetricSearchType.FamilyGroupsByServiceTime) {
      const [churchId, zoneId] = term.split('&');

      if (!allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const zone = await this.zoneRepository.findOne({
            where: {
              id: zoneId,
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: [
              'familyGroups',
              'familyGroups.theirChurch',
              'familyGroups.theirSupervisor.member',
            ],
          });

          const timeStringToMinutes = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
          };

          const familyGroups = zone.familyGroups;

          const familyGroupsSorted = familyGroups.sort(
            (a, b) =>
              timeStringToMinutes(a.serviceTime) -
              timeStringToMinutes(b.serviceTime),
          );

          return familyGroupFormatterByServiceTime({
            familyGroups: familyGroupsSorted,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const allZones = await this.zoneRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['familyGroups', 'familyGroups.theirChurch'],
          });

          const timeStringToMinutes = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
          };

          const familyGroupsSorted = allZones
            .map((zone) => zone.familyGroups)
            .flat()
            .sort(
              (a, b) =>
                timeStringToMinutes(a.serviceTime) -
                timeStringToMinutes(b.serviceTime),
            )
            .filter(
              (familyGroup) => familyGroup.recordStatus === RecordStatus.Active,
            );

          return familyGroupFormatterByServiceTime({
            familyGroups: familyGroupsSorted,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Family Groups analysis by record status
    if (term && searchType === MetricSearchType.FamilyGroupsByRecordStatus) {
      const [churchId, zoneId] = term.split('&');

      if (!allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const zone = await this.zoneRepository.findOne({
            where: {
              id: zoneId,
              theirChurch: church,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: [
              'familyGroups',
              'familyGroups.theirSupervisor.member',
              'familyGroups.theirCopastor.member',
              'familyGroups.theirChurch',
              'familyGroups.theirZone',
            ],
          });

          const familyGroups = zone?.familyGroups;

          return familyGroupFormatterByRecordStatus({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const allZones = await this.zoneRepository.find({
            where: {
              theirChurch: church,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: [
              'familyGroups',
              'familyGroups.theirSupervisor.member',
              'familyGroups.theirCopastor.member',
              'familyGroups.theirChurch',
              'familyGroups.theirZone',
            ],
          });

          const familyGroups = allZones
            .map((zone) => zone?.familyGroups)
            .flat();

          return familyGroupFormatterByRecordStatus({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //? OFFERING INCOME METRICS
    //* Offering income proportion
    if (term && searchType === MetricSearchType.OfferingIncomeByProportion) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringIncome = await this.offeringIncomeRepository.find({
          where: { church: church },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
        });

        return offeringIncomeProportionFormatter({
          offeringIncome: offeringIncome,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Offering income by sunday service
    if (term && searchType === MetricSearchType.OfferingIncomeBySundayService) {
      if (isSingleMonth) {
        const [churchId, startMonthName, year] = term.split('&');

        const monthDate = new Date(`${startMonthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.SundayService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeBySundayServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.SundayService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              date: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeBySundayServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by family groups
    if (term && searchType === MetricSearchType.OfferingIncomeByFamilyGroup) {
      if (isSingleMonth) {
        const [churchId, zoneId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const zone = await this.zoneRepository.findOne({
            where: {
              id: zoneId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!zone) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.FamilyGroup,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'familyGroup',
              'familyGroup.disciples.member',
              'familyGroup.theirPreacher.member',
              'familyGroup.theirZone',
            ],
          });

          const offeringIncomeByZone = offeringIncome.filter(
            (offeringIncome) =>
              offeringIncome?.familyGroup?.theirZone?.id === zone?.id,
          );

          return offeringIncomeByFamilyGroupFormatter({
            offeringIncome: offeringIncomeByZone,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.FamilyGroup,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'familyGroup',
              'familyGroup.disciples.member',
              'familyGroup.theirPreacher.member',
              'familyGroup.theirZone',
            ],
          });

          return offeringIncomeByFamilyGroupFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by sunday school
    if (term && searchType === MetricSearchType.OfferingIncomeBySundaySchool) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.SundaySchool,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'pastor.member',
              'copastor.member',
              'supervisor.member',
              'preacher.member',
              'disciple.member',
            ],
          });

          return offeringIncomeBySundaySchoolFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.SundaySchool,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'pastor.member',
              'copastor.member',
              'supervisor.member',
              'preacher.member',
              'disciple.member',
            ],
          });

          return offeringIncomeBySundaySchoolFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by fasting and vigil
    if (
      term &&
      searchType === MetricSearchType.OfferingIncomeByFastingAndVigil
    ) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const OfferingIncomeByGeneralFastingAndGeneralVigilAndChurch =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: In([
                  OfferingIncomeSearchType.GeneralFasting,
                  OfferingIncomeSearchType.GeneralVigil,
                ]),

                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                date: order as FindOptionsOrderValue,
              },
              relations: ['church'],
            });

          const OfferingIncomeByZonalFastingAndZonalVigil =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: In([
                  OfferingIncomeSearchType.ZonalVigil,
                  OfferingIncomeSearchType.ZonalFasting,
                ]),

                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                date: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'zone',
                'zone.theirSupervisor.member',
                'zone.disciples.member',
              ],
            });

          return offeringIncomeByFastingAndVigilFormatter({
            offeringIncome: [
              ...OfferingIncomeByGeneralFastingAndGeneralVigilAndChurch,
              ...OfferingIncomeByZonalFastingAndZonalVigil,
            ],
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const OfferingIncomeByGeneralFastingAndGeneralVigilAndChurch =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: In([
                  OfferingIncomeSearchType.GeneralFasting,
                  OfferingIncomeSearchType.GeneralVigil,
                ]),

                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                date: order as FindOptionsOrderValue,
              },
              relations: ['church'],
            });

          const OfferingIncomeByZonalFastingAndZonalVigil =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: In([
                  OfferingIncomeSearchType.ZonalVigil,
                  OfferingIncomeSearchType.ZonalFasting,
                ]),

                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                date: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'zone',
                'zone.theirSupervisor.member',
                'zone.disciples.member',
              ],
            });

          return offeringIncomeByFastingAndVigilFormatter({
            offeringIncome: [
              ...OfferingIncomeByGeneralFastingAndGeneralVigilAndChurch,
              ...OfferingIncomeByZonalFastingAndZonalVigil,
            ],
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by youth service
    if (term && searchType === MetricSearchType.OfferingIncomeByYouthService) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.YouthService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              date: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'pastor.member',
              'copastor.member',
              'supervisor.member',
              'preacher.member',
              'disciple.member',
            ],
          });

          return offeringIncomeByYouthServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.YouthService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              date: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'pastor.member',
              'copastor.member',
              'supervisor.member',
              'preacher.member',
              'disciple.member',
            ],
          });

          return offeringIncomeByYouthServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by special offering
    if (
      term &&
      searchType === MetricSearchType.OfferingIncomeBySpecialOffering
    ) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncomeBySpecialOffering =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: OfferingIncomeSearchType.Special,
                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                date: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'pastor.member',
                'copastor.member',
                'supervisor.member',
                'preacher.member',
                'disciple.member',
              ],
            });

          return offeringIncomeBySpecialOfferingFormatter({
            offeringIncome: offeringIncomeBySpecialOffering,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncomeBySpecialOffering =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: OfferingIncomeSearchType.Special,
                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                date: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'pastor.member',
                'copastor.member',
                'supervisor.member',
                'preacher.member',
                'disciple.member',
              ],
            });

          return offeringIncomeBySpecialOfferingFormatter({
            offeringIncome: offeringIncomeBySpecialOffering,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by church ground
    if (term && searchType === MetricSearchType.OfferingIncomeByChurchGround) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncomeBySpecialOffering =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: OfferingIncomeSearchType.ChurchGround,
                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                date: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'pastor.member',
                'copastor.member',
                'supervisor.member',
                'preacher.member',
                'disciple.member',
              ],
            });

          return offeringIncomeByChurchGroundFormatter({
            offeringIncome: offeringIncomeBySpecialOffering,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncomeBySpecialOffering =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: OfferingIncomeSearchType.ChurchGround,
                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                date: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'pastor.member',
                'copastor.member',
                'supervisor.member',
                'preacher.member',
                'disciple.member',
              ],
            });

          return offeringIncomeByChurchGroundFormatter({
            offeringIncome: offeringIncomeBySpecialOffering,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by united service
    if (term && searchType === MetricSearchType.OfferingIncomeByUnitedService) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.UnitedService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              date: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByUnitedServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.UnitedService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              date: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByUnitedServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by activities
    if (term && searchType === MetricSearchType.OfferingIncomeByActivities) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.Activities,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              date: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByActivitiesFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.Activities,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              date: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByActivitiesFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by income adjustment
    if (term && searchType === MetricSearchType.OfferingIncomeAdjustment) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              type: OfferingIncomeSearchType.IncomeAdjustment,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              date: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByIncomeAdjustmentFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              type: OfferingIncomeSearchType.IncomeAdjustment,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              date: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByIncomeAdjustmentFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //? OFFERING EXPENSE METRICS
    //* Offering expense proportion
    if (term && searchType === MetricSearchType.OfferingExpensesByProportion) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: { church: church },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return offeringExpenseProportionFormatter({
          offeringExpenses: offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Operational offering expenses
    if (term && searchType === MetricSearchType.OperationalOfferingExpenses) {
      const [churchId, monthName, year] = term.split('&');

      const monthDate = new Date(`${monthName} 1, ${year}`);
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            type: OfferingExpenseSearchType.OperationalExpenses,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return offeringExpenseChartFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Maintenance and repair offering expenses
    if (
      term &&
      searchType === MetricSearchType.MaintenanceAndRepairOfferingExpenses
    ) {
      const [churchId, monthName, year] = term.split('&');

      const monthDate = new Date(`${monthName} 1, ${year}`);
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            type: OfferingExpenseSearchType.MaintenanceAndRepairExpenses,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return offeringExpenseChartFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Decoration and repair offering expenses
    if (term && searchType === MetricSearchType.DecorationOfferingExpenses) {
      const [churchId, monthName, year] = term.split('&');

      const monthDate = new Date(`${monthName} 1, ${year}`);
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            type: OfferingExpenseSearchType.DecorationExpenses,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return offeringExpenseChartFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Equipment and technology and repair offering expenses
    if (
      term &&
      searchType === MetricSearchType.EquipmentAndTechnologyOfferingExpenses
    ) {
      const [churchId, monthName, year] = term.split('&');

      const monthDate = new Date(`${monthName} 1, ${year}`);
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            type: OfferingExpenseSearchType.EquipmentAndTechnologyExpenses,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return offeringExpenseChartFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Supplies offering expenses
    if (term && searchType === MetricSearchType.SuppliesOfferingExpenses) {
      const [churchId, monthName, year] = term.split('&');

      const monthDate = new Date(`${monthName} 1, ${year}`);
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            type: OfferingExpenseSearchType.SuppliesExpenses,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return offeringExpenseChartFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Planing events expenses
    if (term && searchType === MetricSearchType.PlaningEventsOfferingExpenses) {
      const [churchId, monthName, year] = term.split('&');

      const monthDate = new Date(`${monthName} 1, ${year}`);
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            type: OfferingExpenseSearchType.PlaningEventsExpenses,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return offeringExpenseChartFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Offering expenses adjustment
    if (term && searchType === MetricSearchType.OfferingExpensesAdjustment) {
      const [churchId, monthName, year] = term.split('&');

      const monthDate = new Date(`${monthName} 1, ${year}`);
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            type: OfferingExpenseSearchType.ExpensesAdjustment,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return offeringExpensesAdjustmentFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? OFFERING COMPARATIVE METRICS
    //* Offering comparative proportion
    if (
      term &&
      searchType ===
        MetricSearchType.OfferingExpensesAndOfferingIncomeByProportion
    ) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: { church: church, recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const offeringIncome = await this.offeringIncomeRepository.find({
          where: { church: church, recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return offeringExpensesAndOfferingIncomeProportionFormatter({
          offeringExpenses,
          offeringIncome,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Income and expenses comparative
    if (
      term &&
      searchType === MetricSearchType.IncomeAndExpensesComparativeByYear
    ) {
      const [churchId, currency, yearValue] = term.split('&');
      const year = +yearValue;

      const currentYearStartDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const currentYearEndDate = new Date(
        Date.UTC(year, 11, 31, 23, 59, 59, 999),
      );

      const previousYearStartDate = new Date(Date.UTC(year - 1, 0, 1, 0, 0, 0));
      const previousYearEndDate = new Date(
        Date.UTC(year - 1, 11, 31, 23, 59, 59, 999),
      );

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        //* Current year
        const currentYearOfferingIncome =
          await this.offeringIncomeRepository.find({
            where: {
              church: church,
              currency: currency,
              date: Between(currentYearStartDate, currentYearEndDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

        const currentYearOfferingExpenses =
          await this.offeringExpenseRepository.find({
            where: {
              church: church,
              currency: currency,
              date: Between(currentYearStartDate, currentYearEndDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

        //* Previous year
        const previousYearOfferingIncome =
          await this.offeringIncomeRepository.find({
            where: {
              church: church,
              currency: currency,
              date: Between(previousYearStartDate, previousYearEndDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

        const previousYearOfferingExpenses =
          await this.offeringExpenseRepository.find({
            where: {
              church: church,
              currency: currency,
              date: Between(previousYearStartDate, previousYearEndDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

        return IncomeAndExpensesComparativeFormatter({
          currentYearOfferingIncome: currentYearOfferingIncome,
          currentYearOfferingExpenses: currentYearOfferingExpenses,
          previousYearOfferingIncome: previousYearOfferingIncome,
          previousYearOfferingExpenses: previousYearOfferingExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* General comparative offering Income
    if (
      term &&
      searchType === MetricSearchType.GeneralComparativeOfferingIncome
    ) {
      const [churchId, startMonthName, endMonthName, year] = term.split('&');

      const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
      const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

      const startDate = startOfMonth(startMonthDate);
      const endDate = endOfMonth(endMonthDate);

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringIncome = await this.offeringIncomeRepository.find({
          where: {
            church: church,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return generalComparativeOfferingIncomeFormatter({
          offeringIncome: offeringIncome,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Comparative offering Income by type
    if (
      term &&
      searchType === MetricSearchType.ComparativeOfferingIncomeByType
    ) {
      const [churchId, type, yearValue] = term.split('&');
      const year = +yearValue;

      const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        let offeringIncome: OfferingIncome[];
        if (type !== OfferingIncomeCreationType.IncomeAdjustment) {
          offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: type,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });
        }

        if (type === OfferingIncomeCreationType.IncomeAdjustment) {
          offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              type: type,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });
        }

        return comparativeOfferingIncomeByTypeFormatter({
          offeringIncome: offeringIncome,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* General comparative offering expenses
    if (
      term &&
      searchType === MetricSearchType.GeneralComparativeOfferingExpenses
    ) {
      const [churchId, startMonthName, endMonthName, year] = term.split('&');

      const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
      const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

      const startDate = startOfMonth(startMonthDate);
      const endDate = endOfMonth(endMonthDate);

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return generalComparativeOfferingExpensesFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Comparative offering Expenses by type
    if (
      term &&
      searchType === MetricSearchType.ComparativeOfferingExpensesByType
    ) {
      const [churchId, type, yearValue] = term.split('&');
      const year = +yearValue;

      const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            type: type,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return comparativeOfferingExpensesByTypeFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Comparative offering expenses by sub type
    if (
      term &&
      searchType === MetricSearchType.ComparativeOfferingExpensesBySubType
    ) {
      const [churchId, type, startMonthName, endMonthName, year] =
        term.split('&');

      const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
      const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

      const startDate = startOfMonth(startMonthDate);
      const endDate = endOfMonth(endMonthDate);

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            type: type,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return ComparativeOfferingExpensesBySubTypeFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(`${error.message}`);
    }

    // console.log(error);

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador y que revise los registros de consola.',
    );
  }
}
