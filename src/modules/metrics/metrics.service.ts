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
  familyGroupFormatterByWorshipTime,
  familyGroupFormatterByRecordStatus,
} from '@/modules/metrics/helpers/family-group';

import { OfferingIncomeSearchType } from '@/modules/offering/income/enums';

import {
  offeringIncomeProportionFormatter,
  offeringIncomeByFamilyGroupFormatter,
  offeringIncomeBySundayServiceFormatter,
  offeringIncomeByFastingAndVigilFormatter,
} from '@/modules/metrics/helpers/offering-income';
import { MetricSearchType } from '@/modules/metrics/enums';

import { Zone } from '@/modules/zone/entities';
import { Church } from '@/modules/church/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';
import { OfferingIncome } from '@/modules/offering/income/entities';

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
            }),
            this.copastorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
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
      const [churchId, valueYear] = term.split('&');
      const year = +valueYear;

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
          }),
          this.copastorRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          }),
          this.supervisorRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          }),
          this.preacherRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          }),
          this.discipleRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
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
          }),
          this.copastorRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
          }),
          this.supervisorRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
          }),
          this.preacherRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
          }),
          this.discipleRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
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
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
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
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
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
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
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
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
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
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
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
            relations: ['zones'],
          });

          const zonesId = copastor?.zones?.map((zone) => zone?.id);

          const zones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: ['theirSupervisor', 'disciples'],
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
            relations: ['theirSupervisor', 'disciples'],
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
            relations: ['zones'],
          });

          const zonesId = copastor.zones.map((zone) => zone?.id);

          const zones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: ['theirSupervisor', 'preachers'],
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
            relations: ['theirSupervisor', 'preachers'],
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
                district: district,
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.copastorRepository.find({
              where: {
                theirChurch: church,
                district: district,
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: {
                theirChurch: church,
                district: district,
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: {
                theirChurch: church,
                district: district,
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: {
                theirChurch: church,
                district: district,
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
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
            }),
            this.copastorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
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
        });

        // Inactive
        const inactiveFamilyGroups = await this.familyGroupRepository.find({
          where: {
            theirChurch: church,
            updatedAt: Between(startDate, endDate),
            recordStatus: RecordStatus.Inactive,
          },
          order: { createdAt: order as FindOptionsOrderValue },
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
            relations: ['theirPreacher', 'disciples'],
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
            relations: ['theirPreacher', 'disciples'],
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
            relations: ['theirSupervisor', 'familyGroups'],
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
            relations: ['theirSupervisor', 'familyGroups'],
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

    //* Family Groups analysis by worship time
    if (term && searchType === MetricSearchType.FamilyGroupsByWorshipTime) {
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
            relations: ['familyGroups', 'familyGroups.theirSupervisor'],
          });

          const timeStringToMinutes = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
          };

          const familyGroups = zone.familyGroups;

          const familyGroupsSorted = familyGroups.sort(
            (a, b) =>
              timeStringToMinutes(a.worshipTime) -
              timeStringToMinutes(b.worshipTime),
          );

          return familyGroupFormatterByWorshipTime({
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
            relations: ['familyGroups'],
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
                timeStringToMinutes(a.worshipTime) -
                timeStringToMinutes(b.worshipTime),
            )
            .filter(
              (familyGroup) => familyGroup.recordStatus === RecordStatus.Active,
            );

          return familyGroupFormatterByWorshipTime({
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
              'familyGroups.theirSupervisor',
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
              'familyGroups.theirSupervisor',
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

    //? OFFERINGS INCOME METRICS
    //* Offerings income proportion
    if (term && searchType === MetricSearchType.OfferingsIncomeByProportion) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: { church: church },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return offeringIncomeProportionFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Offerings income by sunday service
    if (
      term &&
      searchType === MetricSearchType.OfferingsIncomeBySundayService
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

        // TODO : replicar esto donde sea necesario
        if (!church) return [];

        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            church: church,
            subType: OfferingIncomeSearchType.SundayWorship,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
        });

        return offeringIncomeBySundayServiceFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Offerings income by family groups
    if (term && searchType === MetricSearchType.OfferingsIncomeByFamilyGroup) {
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

        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            subType: OfferingIncomeSearchType.FamilyGroup,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: [
            'familyGroup',
            'familyGroup.disciples',
            'familyGroup.theirPreacher',
            'familyGroup.theirZone',
            'familyGroup.theirChurch',
          ],
        });

        const offeringIncomeByZone = offeringsIncome.filter(
          (offeringIncome) =>
            offeringIncome?.familyGroup?.theirZone?.id === zone?.id &&
            offeringIncome?.familyGroup?.theirChurch?.id === church?.id,
        );

        return offeringIncomeByFamilyGroupFormatter({
          offeringsIncome: offeringIncomeByZone,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Offerings income by sunday school
    if (term && searchType === MetricSearchType.OfferingsIncomeBySundaySchool) {
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

        const offeringsIncome = await this.offeringIncomeRepository.find({
          where: {
            church: church,
            subType: OfferingIncomeSearchType.SundaySchool,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
        });

        return offeringIncomeBySundayServiceFormatter({
          offeringsIncome,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Offerings income by fasting and vigil
    if (
      term &&
      searchType === MetricSearchType.OfferingsIncomeByFastingAndVigil
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

        const OfferingsIncomeByGeneralFastingAndGeneralVigilAndChurch =
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
          });

        const AllOfferingsIncomeByZonalFastingAndZonalVigil =
          await this.offeringIncomeRepository.find({
            where: {
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
              'zone',
              'zone.theirChurch',
              'zone.theirSupervisor',
              'zone.disciples',
            ],
          });

        const OfferingsIncomeByZonalFastingAndZonalVigilAndChurch =
          AllOfferingsIncomeByZonalFastingAndZonalVigil.filter(
            (offeringIncome) =>
              offeringIncome?.zone?.theirChurch?.id === church?.id,
          );

        return offeringIncomeByFastingAndVigilFormatter({
          offeringsIncome: [
            ...OfferingsIncomeByGeneralFastingAndGeneralVigilAndChurch,
            ...OfferingsIncomeByZonalFastingAndZonalVigilAndChurch,
          ],
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

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador y que revise los registros de consola.',
    );
  }
}
