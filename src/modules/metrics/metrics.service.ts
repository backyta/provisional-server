import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, In, Repository } from 'typeorm';

import { RecordStatus } from '@/common/enums';
import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

import {
  memberCountFormatter,
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
} from '@/modules/metrics/helpers';

import { MetricSearchType } from '@/modules/metrics/enums';

import { Zone } from '@/modules/zone/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Supervisor } from '@/modules/supervisor/entities';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger('MetricsService');

  constructor(
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
  ) {}

  //* FIND ALL AND COUNT MEMBERS
  async findAllAndCountMembers(paginationDto: PaginationDto): Promise<any[]> {
    const { order = 'ASC' } = paginationDto;

    try {
      const [pastors, copastors, supervisors, preachers, disciples] =
        await Promise.all([
          this.pastorRepository.find({
            order: { createdAt: order as FindOptionsOrderValue },
          }),
          this.copastorRepository.find({
            order: { createdAt: order as FindOptionsOrderValue },
          }),
          this.supervisorRepository.find({
            order: { createdAt: order as FindOptionsOrderValue },
          }),
          this.preacherRepository.find({
            order: { createdAt: order as FindOptionsOrderValue },
          }),
          this.discipleRepository.find({
            order: { createdAt: order as FindOptionsOrderValue },
          }),
        ]);

      return memberCountFormatter({
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

  //? FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<any> {
    const {
      'search-type': searchType,
      // limit,
      // offset = 0,
      order,
      allZones,
    } = searchTypeAndPaginationDto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido.`);
    }

    //? MEMBER METRICS
    //* Members fluctuation analysis by year
    if (term && searchType === MetricSearchType.MembersFluctuationByYear) {
      const year = +term;

      const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      // New
      try {
        const newMembers = await Promise.all([
          this.pastorRepository.find({
            where: {
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          }),
          this.copastorRepository.find({
            where: {
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          }),
          this.supervisorRepository.find({
            where: {
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          }),
          this.preacherRepository.find({
            where: {
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          }),
          this.discipleRepository.find({
            where: {
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
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
          }),
          this.copastorRepository.find({
            where: {
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
          }),
          this.supervisorRepository.find({
            where: {
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
          }),
          this.preacherRepository.find({
            where: {
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
          }),
          this.discipleRepository.find({
            where: {
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
        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.copastorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { recordStatus: RecordStatus.Active },
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
        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.copastorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { recordStatus: RecordStatus.Active },
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
        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.copastorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { recordStatus: RecordStatus.Active },
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
        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.copastorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { recordStatus: RecordStatus.Active },
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
        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.copastorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { recordStatus: RecordStatus.Active },
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
      if (!allZones) {
        try {
          const copastor = await this.copastorRepository.findOne({
            where: {
              id: term,
              recordStatus: RecordStatus.Active,
            },
            relations: ['zones'],
          });

          if (!copastor) {
            throw new NotFoundException(
              `No se encontró un copastor con este ID ${term}`,
            );
          }

          const zonesId = copastor.zones.map((zone) => zone.id);

          const zones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
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
          const copastors = await this.copastorRepository.find({
            where: {
              recordStatus: RecordStatus.Active,
            },
            relations: ['zones'],
          });

          if (copastors.length === 0) {
            throw new NotFoundException(`No se encontraron copastores.`);
          }

          const zonesByCopastor = copastors
            .map((copastor) => copastor.zones)
            .flat();

          const zonesId = zonesByCopastor.map((zone) => zone.id);

          const allZones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
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
      if (!allZones) {
        try {
          const copastor = await this.copastorRepository.findOne({
            where: {
              id: term,
              recordStatus: RecordStatus.Active,
            },
            relations: ['zones'],
          });

          if (!copastor) {
            throw new BadRequestException(
              `No se encontró un copastor con este ID ${term}`,
            );
          }

          const zonesId = copastor.zones.map((zone) => zone.id);

          const zones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
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
          const copastors = await this.copastorRepository.find({
            where: {
              recordStatus: RecordStatus.Active,
            },
            relations: ['zones'],
          });

          if (copastors.length === 0) {
            throw new NotFoundException(`No se encontraron copastores.`);
          }

          const zonesByCopastor = copastors
            .map((copastor) => copastor.zones)
            .flat();

          const zonesId = zonesByCopastor.map((zone) => zone.id);

          const allZones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
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
      try {
        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { district: term, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.copastorRepository.find({
              where: { district: term, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              where: { district: term, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              where: { district: term, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
              where: { district: term, recordStatus: RecordStatus.Active },
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
        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.copastorRepository.find({
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.supervisorRepository.find({
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.preacherRepository.find({
              order: { createdAt: order as FindOptionsOrderValue },
            }),
            this.discipleRepository.find({
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

// NOTE: PROBLEMA CON EL CORREO POR ENTIDAD SOLO ES UNIQUE DEBE SER GLOBAL (SOLO CUANDO SUBE DE NIVEL)
