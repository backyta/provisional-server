import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { format } from 'date-fns';

import {
  SearchType,
  GenderNames,
  SearchSubType,
  SearchTypeNames,
  RecordStatusNames,
  SearchSubTypeNames,
  MaritalStatusNames,
} from '@/common/enums';
import {
  PaginationDto,
  MetricsPaginationDto,
  SearchAndPaginationDto,
} from '@/common/dtos';

import { UserRoleNames } from '@/modules/auth/enums';

import {
  MemberTypeNames,
  OfferingIncomeCreationShiftTypeNames,
} from '@/modules/offering/income/enums';

import { DateFormatter } from '@/modules/reports/helpers';
import { PrinterService } from '@/modules/printer/printer.service';
import {
  getUsersReport,
  getZonesReport,
  getMembersReport,
  getChurchesReport,
  getFamilyGroupsReport,
  getMemberMetricsReport,
  getOfferingIncomeReport,
  getOfferingExpensesReport,
  getFamilyGroupMetricsReport,
  getStudyCertificateByIdReport,
  getOfferingIncomeMetricsReport,
} from '@/modules/reports/reports-types';

import { UserService } from '@/modules/user/user.service';
import { PastorService } from '@/modules/pastor/pastor.service';
import { ChurchService } from '@/modules/church/church.service';
import { DiscipleService } from '@/modules/disciple/disciple.service';
import { CopastorService } from '@/modules/copastor/copastor.service';
import { PreacherService } from '@/modules/preacher/preacher.service';
import { SupervisorService } from '@/modules/supervisor/supervisor.service';
import { FamilyGroupService } from '@/modules/family-group/family-group.service';
import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';
import { OfferingExpenseService } from '@/modules/offering/expense/offering-expense.service';

import { Zone } from '@/modules/zone/entities';
import { User } from '@/modules/user/entities';
import { Member } from '@/modules/member/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Church } from '@/modules/church/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Disciple } from '@/modules/disciple/entities';
import { ZoneService } from '@/modules/zone/zone.service';
import { MetricSearchType } from '@/modules/metrics/enums';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';
import { MetricsService } from '@/modules/metrics/metrics.service';
import { OfferingIncome } from '@/modules/offering/income/entities';
import { OfferingExpense } from '@/modules/offering/expense/entities';

import {
  MonthlyMemberResultData,
  MembersByZoneResultData,
  PreachersByZoneResultData,
  MembersByCategoryResultData,
  MembersByRecordStatusResultData,
  MemberByRoleAndGenderResultData,
  MembersByMaritalStatusResultData,
  MonthlyMemberFluctuationResultData,
  MembersByCategoryAndGenderResultData,
  MembersByDistrictAndGenderResultData,
} from '@/modules/metrics/helpers/member';
import {
  FamilyGroupsByCodeResultData,
  FamilyGroupsByZoneResultData,
  FamilyGroupsByDistrictResultData,
  FamilyGroupsByServiceTimeResultData,
  FamilyGroupsByRecordStatusResultData,
  MonthlyFamilyGroupsFluctuationResultData,
} from '@/modules/metrics/helpers/family-group';
import {
  OfferingIncomeByActivitiesResultData,
  OfferingIncomeByFamilyGroupResultData,
  OfferingIncomeByChurchGroundResultData,
  OfferingIncomeBySundaySchoolResultData,
  OfferingIncomeByYouthServiceResultData,
  OfferingIncomeBySundayServiceResultData,
  OfferingIncomeByUnitedServiceResultData,
  OfferingIncomeByFastingAndVigilResultData,
  OfferingIncomeByIncomeAdjustmentResultData,
  OfferingIncomeBySpecialOfferingResultData,
} from '@/modules/metrics/helpers/offering-income';

//TODO : ver si se usar try catch, si es que el error revienta aqui o en servicio que se consume.
// Hacerlo!!!!!

@Injectable()
export class ReportsService {
  private readonly logger = new Logger('ReportsService');

  constructor(
    private readonly printerService: PrinterService,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    private readonly churchService: ChurchService,
    private readonly pastorService: PastorService,
    private readonly copastorService: CopastorService,
    private readonly supervisorService: SupervisorService,
    private readonly preacherService: PreacherService,
    private readonly discipleService: DiscipleService,

    private readonly zoneService: ZoneService,
    private readonly familyGroupService: FamilyGroupService,

    private readonly offeringIncomeService: OfferingIncomeService,
    private readonly offeringExpenseService: OfferingExpenseService,

    private readonly userService: UserService,

    private readonly metricsService: MetricsService,
  ) {}

  //* STUDENT CERTIFICATE
  async getStudyCertificateById(studentId: string) {
    const student = await this.memberRepository.findOne({
      where: {
        id: studentId,
      },
    });

    if (!student) {
      throw new NotFoundException(
        `Estudiante con id: ${studentId}, no fue encontrado.`,
      );
    }

    const docDefinition = getStudyCertificateByIdReport({
      studentName: `${student.firstName} ${student.lastName}`,
      directorName: 'Marcos Alberto Reyes Quispe',
      studyStartDate: DateFormatter.getDDMMYYYY(new Date('2024-03-07')),
      studyEndDate: DateFormatter.getDDMMYYYY(new Date('2024-10-07')),
      classSchedule: '17:00 a 19:00',
      hoursNumber: 10,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? CHURCHES
  //* GENERAL CHURCHES REPORT
  async getGeneralChurches(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    const churches: Church[] = await this.churchService.findAll(paginationDto);

    if (!churches) {
      throw new NotFoundException(
        `No se encontraron iglesias con estos términos de búsqueda.`,
      );
    }

    const docDefinition = getChurchesReport({
      title: 'Reporte de Iglesias',
      subTitle: 'Resultados de Búsqueda de Iglesias',
      description: 'iglesias',
      orderSearch: order,
      data: churches,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* CHURCHES REPORT BY TERM
  async getChurchesByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { 'search-type': searchType, 'search-sub-type': searchSubType } =
      searchTypeAndPaginationDto;

    const churches: Church[] = await this.churchService.findByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    if (!churches) {
      throw new NotFoundException(
        `No se encontraron iglesias con estos términos de búsqueda.`,
      );
    }

    let newTerm: string;
    newTerm = term;

    // By Founding Date
    if (searchType === SearchType.FoundingDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${formattedFromDate} - ${formattedToDate}`;
    }

    // By Record Status
    if (searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      newTerm = `${RecordStatusNames[recordStatusTerm]} `;
    }

    const docDefinition = getChurchesReport({
      title: 'Reporte de Iglesias',
      subTitle: 'Resultados de Búsqueda de Iglesias',
      description: 'iglesias',
      searchTerm: `Termino de búsqueda: ${newTerm}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: churches,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? PASTORS
  //* GENERAL PASTORS REPORT
  async getGeneralPastors(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    const pastors: Pastor[] = await this.pastorService.findAll(paginationDto);

    if (!pastors) {
      throw new NotFoundException(
        `No se encontraron pastores con estos términos de búsqueda.`,
      );
    }

    const docDefinition = getMembersReport({
      title: 'Reporte de Pastores',
      subTitle: 'Resultados de Búsqueda de Pastores',
      description: 'pastores',
      orderSearch: order,
      data: pastors,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* PASTORS REPORT BY TERM
  async getPastorsByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { 'search-type': searchType, 'search-sub-type': searchSubType } =
      searchTypeAndPaginationDto;

    const pastors: Pastor[] = await this.pastorService.findByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    if (!pastors) {
      throw new NotFoundException(
        `No se encontraron pastores con estos términos de búsqueda.`,
      );
    }

    let newTerm: string;
    newTerm = term;

    // By Birth Date
    if (searchType === SearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${formattedFromDate} - ${formattedToDate}`;
    }

    // By Birth Month
    if (searchType === SearchType.BirthMonth) {
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

      newTerm = monthNames[term.toLowerCase()] ?? term;
    }

    // By Gender
    if (searchType === SearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      newTerm = `${GenderNames[genderTerm]}`;
    }

    // By Marital Status
    if (searchType === SearchType.MaritalStatus) {
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

      newTerm = `${MaritalStatusNames[maritalStatusTerm]}`;
    }

    // By Record Status
    if (searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      newTerm = `${RecordStatusNames[recordStatusTerm]} `;
    }

    const docDefinition = getMembersReport({
      title: 'Reporte de Pastores',
      subTitle: 'Resultados de Búsqueda de Pastores',
      description: 'pastores',
      searchTerm: `Termino de búsqueda: ${newTerm}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: pastors,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? COPASTORS
  //* GENERAL COPASTORS REPORT
  async getGeneralCopastors(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    const copastors: Copastor[] =
      await this.copastorService.findAll(paginationDto);

    if (!copastors) {
      throw new NotFoundException(
        `No se encontraron co-pastores con estos términos de búsqueda.`,
      );
    }

    const docDefinition = getMembersReport({
      title: 'Reporte de Co-Pastores',
      subTitle: 'Resultados de Búsqueda de Co-Pastores',
      description: 'co-pastores',
      orderSearch: order,
      data: copastors,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* COPASTORS REPORT BY TERM
  async getCopastorsByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { 'search-type': searchType, 'search-sub-type': searchSubType } =
      searchTypeAndPaginationDto;

    const copastors: Copastor[] = await this.copastorService.findByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    if (!copastors) {
      throw new NotFoundException(
        `No se encontraron co-pastores con estos términos de búsqueda.`,
      );
    }

    let newTerm: string;
    newTerm = term;

    // By Birth Date
    if (searchType === SearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${formattedFromDate} - ${formattedToDate}`;
    }

    // By Birth Month
    if (searchType === SearchType.BirthMonth) {
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

      newTerm = monthNames[term.toLowerCase()] ?? term;
    }

    // By Gender
    if (searchType === SearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      newTerm = `${GenderNames[genderTerm]}`;
    }

    // By Marital Status
    if (searchType === SearchType.MaritalStatus) {
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

      newTerm = `${MaritalStatusNames[maritalStatusTerm]}`;
    }

    // By Record Status
    if (searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      newTerm = `${RecordStatusNames[recordStatusTerm]} `;
    }

    const docDefinition = getMembersReport({
      title: 'Reporte de Co-Pastores',
      subTitle: 'Resultados de Búsqueda de Co-Pastores',
      description: 'co-pastores',
      searchTerm: `Termino de búsqueda: ${newTerm}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: copastors,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? SUPERVISORS
  //* GENERAL SUPERVISORS REPORT
  async getGeneralSupervisors(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    const supervisors: Supervisor[] =
      await this.supervisorService.findAll(paginationDto);

    if (!supervisors) {
      throw new NotFoundException(
        `No se encontraron supervisores con estos términos de búsqueda.`,
      );
    }

    const docDefinition = getMembersReport({
      title: 'Reporte de Supervisores',
      subTitle: 'Resultados de Búsqueda de Supervisores',
      description: 'supervisores',
      orderSearch: order,
      data: supervisors,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* SUPERVISORS REPORT BY TERM
  async getSupervisorsByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { 'search-type': searchType, 'search-sub-type': searchSubType } =
      searchTypeAndPaginationDto;

    const supervisors: Supervisor[] = await this.supervisorService.findByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    if (!supervisors) {
      throw new NotFoundException(
        `No se encontraron supervisores con estos términos de búsqueda.`,
      );
    }

    let newTerm: string;
    newTerm = term;

    // By birth Date
    if (searchType === SearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${formattedFromDate} - ${formattedToDate}`;
    }

    // By Birth Month
    if (searchType === SearchType.BirthMonth) {
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

      newTerm = monthNames[term.toLowerCase()] ?? term;
    }

    // By Gender
    if (searchType === SearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      newTerm = `${GenderNames[genderTerm]}`;
    }

    // By Marital Status
    if (searchType === SearchType.MaritalStatus) {
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

      newTerm = `${MaritalStatusNames[maritalStatusTerm]}`;
    }

    // By Record Status
    if (searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      newTerm = `${RecordStatusNames[recordStatusTerm]} `;
    }

    const docDefinition = getMembersReport({
      title: 'Reporte de Supervisores',
      subTitle: 'Resultados de Búsqueda de Supervisores',
      description: 'supervisores',
      searchTerm: `Termino de búsqueda: ${newTerm}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: supervisors,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? PREACHERS
  //* GENERAL PREACHERS REPORT
  async getGeneralPreachers(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    const preachers: Preacher[] =
      await this.preacherService.findAll(paginationDto);

    if (!preachers) {
      throw new NotFoundException(
        `No se encontraron predicadores con estos términos de búsqueda.`,
      );
    }

    const docDefinition = getMembersReport({
      title: 'Reporte de Predicadores',
      subTitle: 'Resultados de Búsqueda de Predicadores',
      description: 'predicadores',
      orderSearch: order,
      data: preachers,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* PREACHERS REPORT BY TERM
  async getPreachersByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { 'search-type': searchType, 'search-sub-type': searchSubType } =
      searchTypeAndPaginationDto;

    const preachers: Preacher[] = await this.preacherService.findByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    if (!preachers) {
      throw new NotFoundException(
        `No se encontraron predicadores con estos términos de búsqueda.`,
      );
    }

    let newTerm: string;
    newTerm = term;

    // By Birth Date
    if (searchType === SearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${formattedFromDate} - ${formattedToDate}`;
    }

    // By Birth Month
    if (searchType === SearchType.BirthMonth) {
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

      newTerm = monthNames[term.toLowerCase()] ?? term;
    }

    // By Gender
    if (searchType === SearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      newTerm = `${GenderNames[genderTerm]}`;
    }

    // By Marital Status
    if (searchType === SearchType.MaritalStatus) {
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

      newTerm = `${MaritalStatusNames[maritalStatusTerm]}`;
    }

    // By Record Status
    if (searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      newTerm = `${RecordStatusNames[recordStatusTerm]} `;
    }

    const docDefinition = getMembersReport({
      title: 'Reporte de Predicadores',
      subTitle: 'Resultados de Búsqueda de Predicadores',
      description: 'predicadores',
      searchTerm: `Termino de búsqueda: ${newTerm}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: preachers,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? DISCIPLES
  //* GENERAL DISCIPLES REPORT
  async getGeneralDisciples(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    const disciples: Disciple[] =
      await this.discipleService.findAll(paginationDto);

    if (!disciples) {
      throw new NotFoundException(
        `No se encontraron discípulos con estos términos de búsqueda.`,
      );
    }

    const docDefinition = getMembersReport({
      title: 'Reporte de Discípulos',
      subTitle: 'Resultados de Búsqueda de Discípulos',
      description: 'discípulos',
      orderSearch: order,
      data: disciples,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* DISCIPLES REPORT BY TERM
  async getDisciplesByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { 'search-type': searchType, 'search-sub-type': searchSubType } =
      searchTypeAndPaginationDto;

    const disciples: Disciple[] = await this.discipleService.findByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    if (!disciples) {
      throw new NotFoundException(
        `No se encontraron discípulos con estos términos de búsqueda.`,
      );
    }

    let newTerm: string;
    newTerm = term;

    // By Birth Date
    if (searchType === SearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${formattedFromDate} - ${formattedToDate}`;
    }

    // By Birth Month
    if (searchType === SearchType.BirthMonth) {
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

      newTerm = monthNames[term.toLowerCase()] ?? term;
    }

    // By Gender
    if (searchType === SearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      newTerm = `${GenderNames[genderTerm]}`;
    }

    // By Marital Status
    if (searchType === SearchType.MaritalStatus) {
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

      newTerm = `${MaritalStatusNames[maritalStatusTerm]}`;
    }

    // By Record Status
    if (searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      newTerm = `${RecordStatusNames[recordStatusTerm]} `;
    }

    const docDefinition = getMembersReport({
      title: 'Reporte de Discípulos',
      subTitle: 'Resultados de Búsqueda de Discípulos',
      description: 'discípulos',
      searchTerm: `Termino de búsqueda: ${newTerm}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: disciples,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? ZONES
  //* GENERAL ZONES REPORT
  async getGeneralZones(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    const zones: Zone[] = await this.zoneService.findAll(paginationDto);

    if (!zones) {
      throw new NotFoundException(
        `No se encontraron zonas con estos términos de búsqueda.`,
      );
    }

    const docDefinition = getZonesReport({
      title: 'Reporte de Zonas',
      subTitle: 'Resultados de Búsqueda de Zonas',
      description: 'zonas',
      orderSearch: order,
      data: zones,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* ZONES REPORT BY TERM
  async getZonesByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { 'search-type': searchType, 'search-sub-type': searchSubType } =
      searchTypeAndPaginationDto;

    const zones: Zone[] = await this.zoneService.findByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    if (!zones) {
      throw new NotFoundException(
        `No se encontraron zonas con estos términos de búsqueda.`,
      );
    }

    let newTerm: string;
    newTerm = term;

    // By Record Status
    if (searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      newTerm = `${RecordStatusNames[recordStatusTerm]} `;
    }

    const docDefinition = getZonesReport({
      title: 'Reporte de Zonas',
      subTitle: 'Resultados de Búsqueda de Zonas',
      description: 'zonas',
      searchTerm: `Termino de búsqueda: ${newTerm}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: zones,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? FAMILY GROUPS
  //* GENERAL FAMILY GROUPS REPORT
  async getGeneralFamilyGroups(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    const familyGroups: FamilyGroup[] =
      await this.familyGroupService.findAll(paginationDto);

    if (!familyGroups) {
      throw new NotFoundException(
        `No se encontraron grupos familiares con estos términos de búsqueda.`,
      );
    }

    const docDefinition = getFamilyGroupsReport({
      title: 'Reporte de Grupos Familiares',
      subTitle: 'Resultados de Búsqueda de Grupos Familiares',
      description: 'grupos familiares',
      orderSearch: order,
      data: familyGroups,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* FAMILY GROUPS REPORT BY TERM
  async getFamilyGroupsByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { 'search-type': searchType, 'search-sub-type': searchSubType } =
      searchTypeAndPaginationDto;

    const familyGroups: FamilyGroup[] =
      await this.familyGroupService.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

    if (!familyGroups) {
      throw new NotFoundException(
        `No se encontraron grupos familiares con estos términos de búsqueda.`,
      );
    }

    let newTerm: string;
    newTerm = term;

    // By Record Status
    if (searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      newTerm = `${RecordStatusNames[recordStatusTerm]} `;
    }

    const docDefinition = getFamilyGroupsReport({
      title: 'Reporte de Grupos Familiares',
      subTitle: 'Resultados de Búsqueda de Grupos Familiares',
      description: 'grupos familiares',
      searchTerm: `Termino de búsqueda: ${newTerm}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: familyGroups,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? OFFERING INCOME
  //* GENERAL OFFERING INCOME REPORT
  async getGeneralOfferingIncome(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    const offeringIncome: OfferingIncome[] =
      await this.offeringIncomeService.findAll(paginationDto);

    if (!offeringIncome) {
      throw new NotFoundException(
        `No se encontraron ingresos de ofrenda con estos términos de búsqueda.`,
      );
    }

    const docDefinition = getOfferingIncomeReport({
      title: 'Reporte de Ingresos de Ofrenda',
      subTitle: 'Resultados de Búsqueda de Ingresos de Ofrenda',
      description: 'registros',
      orderSearch: order,
      data: offeringIncome,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* OFFERING INCOME REPORT BY TERM
  async getOfferingIncomeByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { 'search-type': searchType, 'search-sub-type': searchSubType } =
      searchTypeAndPaginationDto;

    const offeringIncome: OfferingIncome[] =
      await this.offeringIncomeService.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

    if (!offeringIncome) {
      throw new NotFoundException(
        `No se encontraron ingresos de ofrenda con estos términos de búsqueda.`,
      );
    }

    let newTerm: string;
    newTerm = term;

    // By Date
    if (
      (searchType === SearchType.SundayService ||
        searchType === SearchType.SundaySchool ||
        searchType === SearchType.FamilyGroup ||
        searchType === SearchType.ZonalFasting ||
        searchType === SearchType.ZonalVigil ||
        searchType === SearchType.GeneralFasting ||
        searchType === SearchType.GeneralVigil ||
        searchType === SearchType.YouthService ||
        searchType === SearchType.UnitedService ||
        searchType === SearchType.Activities ||
        searchType === SearchType.Special ||
        searchType === SearchType.ChurchGround ||
        searchType === SearchType.IncomeAdjustment) &&
      searchSubType === SearchSubType.OfferingByDate
    ) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${formattedFromDate} - ${formattedToDate}`;
    }

    // By Church
    if (
      (searchType === SearchType.SundayService ||
        searchType === SearchType.SundaySchool ||
        searchType === SearchType.GeneralFasting ||
        searchType === SearchType.GeneralVigil ||
        searchType === SearchType.YouthService ||
        searchType === SearchType.UnitedService ||
        searchType === SearchType.Activities ||
        searchType === SearchType.IncomeAdjustment) &&
      searchSubType === SearchSubType.OfferingByChurch
    ) {
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

      newTerm = `${church.abbreviatedChurchName}`;
    }

    // By Church And Date
    if (
      (searchType === SearchType.SundayService ||
        searchType === SearchType.SundaySchool ||
        searchType === SearchType.GeneralFasting ||
        searchType === SearchType.GeneralVigil ||
        searchType === SearchType.YouthService ||
        searchType === SearchType.UnitedService ||
        searchType === SearchType.Activities ||
        searchType === SearchType.IncomeAdjustment) &&
      searchSubType === SearchSubType.OfferingByChurchDate
    ) {
      const [churchId, date] = term.split('&');

      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
        },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${church.abbreviatedChurchName} ~ ${formattedFromDate} - ${formattedToDate}`;
    }

    // By Shift
    if (
      (searchType === SearchType.SundayService ||
        searchType === SearchType.SundaySchool) &&
      searchSubType === SearchSubType.OfferingByShift
    ) {
      const shiftTerm = term.toLowerCase();
      const validShifts = ['day', 'afternoon'];

      if (!validShifts.includes(shiftTerm)) {
        throw new BadRequestException(`Turno no válido: ${term}`);
      }

      newTerm = `${OfferingIncomeCreationShiftTypeNames[term.toLowerCase()]}`;
    }

    // By Shift and Date
    if (
      (searchType === SearchType.SundayService ||
        searchType === SearchType.SundaySchool) &&
      searchSubType === SearchSubType.OfferingByShiftDate
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

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${OfferingIncomeCreationShiftTypeNames[shift.toLowerCase()]} ~ ${formattedFromDate} - ${formattedToDate}`;
    }

    // By Zone and Date
    if (
      searchType === SearchType.FamilyGroup &&
      searchSubType === SearchSubType.OfferingByZoneDate
    ) {
      const [zone, date] = term.split('&');

      const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${zone} ~ ${formattedFromDate} - ${formattedToDate}`;
    }

    // By Code and Date
    if (
      searchType === SearchType.FamilyGroup &&
      searchSubType === SearchSubType.OfferingByGroupCodeDate
    ) {
      const [code, date] = term.split('&');

      const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${code} ~ ${formattedFromDate} - ${formattedToDate}`;
    }

    // By Contributor names
    if (
      (searchType === SearchType.Special ||
        searchType === SearchType.ChurchGround) &&
      searchSubType === SearchSubType.OfferingByContributorNames
    ) {
      const [memberType, names] = term.split('&');
      const firstNames = names.replace(/\+/g, ' ');

      newTerm = `${MemberTypeNames[memberType]} ~ ${firstNames}`;
    }

    // By Contributor last names
    if (
      (searchType === SearchType.Special ||
        searchType === SearchType.ChurchGround) &&
      searchSubType === SearchSubType.OfferingByContributorLastNames
    ) {
      const [memberType, names] = term.split('&');
      const lastNames = names.split('-')[0].replace(/\+/g, ' ');

      newTerm = `${MemberTypeNames[memberType]} ~ ${lastNames}`;
    }

    // By Contributor full names
    if (
      (searchType === SearchType.Special ||
        searchType === SearchType.ChurchGround) &&
      searchSubType === SearchSubType.OfferingByContributorFullName
    ) {
      const [memberType, names] = term.split('&');
      const firstNames = names.split('-')[0].replace(/\+/g, ' ');
      const lastNames = names.split('-')[1].replace(/\+/g, ' ');

      newTerm = `${MemberTypeNames[memberType]} ~ ${firstNames} ${lastNames}`;
    }

    // By Record Status
    if (searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      newTerm = `${RecordStatusNames[recordStatusTerm]} `;
    }

    const docDefinition = getOfferingIncomeReport({
      title: 'Reporte de Ingresos de Ofrenda',
      subTitle: 'Resultados de Búsqueda de Ingresos de Ofrenda',
      description: 'registros',
      searchTerm: `Termino de búsqueda: ${newTerm}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: offeringIncome,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? OFFERING EXPENSES
  //* GENERAL EXPENSES REPORT
  async getGeneralOfferingExpenses(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    const offeringExpenses: OfferingExpense[] =
      await this.offeringExpenseService.findAll(paginationDto);

    if (!offeringExpenses) {
      throw new NotFoundException(
        `No se encontraron salidas de ofrenda con estos términos de búsqueda.`,
      );
    }

    const docDefinition = getOfferingExpensesReport({
      title: 'Reporte de Salidas de Ofrenda',
      subTitle: 'Resultados de Búsqueda de Salidas de Ofrenda',
      description: 'registros',
      orderSearch: order,
      data: offeringExpenses,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* OFFERING EXPENSES REPORT BY TERM
  async getOfferingExpensesByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { 'search-type': searchType, 'search-sub-type': searchSubType } =
      searchTypeAndPaginationDto;

    const offeringExpenses: OfferingExpense[] =
      await this.offeringExpenseService.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

    if (!offeringExpenses) {
      throw new NotFoundException(
        `No se encontraron salidas de ofrenda con estos términos de búsqueda.`,
      );
    }

    let newTerm: string;
    newTerm = term;

    // By date and church
    if (
      searchType === SearchType.PlaningEventsExpenses ||
      searchType === SearchType.DecorationExpenses ||
      searchType === SearchType.EquipmentAndTechnologyExpenses ||
      searchType === SearchType.MaintenanceAndRepairExpenses ||
      searchType === SearchType.OperationalExpenses ||
      searchType === SearchType.SuppliesExpenses ||
      searchType === SearchType.ExpensesAdjustment
    ) {
      const [churchId, date] = term.split('&');

      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
        },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${church.abbreviatedChurchName} ~ ${formattedFromDate} - ${formattedToDate}`;
    }

    // By Record Status
    if (searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      newTerm = `${RecordStatusNames[recordStatusTerm]}`;
    }

    const docDefinition = getOfferingExpensesReport({
      title: 'Reporte de Salidas de Ofrenda',
      subTitle: 'Resultados de Búsqueda de Salidas de Ofrenda',
      description: 'registros',
      searchTerm: `Termino de búsqueda: ${newTerm}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: offeringExpenses,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? USERS
  //* GENERAL USERS REPORT
  async getGeneralUsers(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    const users: User[] = await this.userService.findAll(paginationDto);

    if (!users) {
      throw new NotFoundException(
        `No se encontraron usuarios con estos términos de búsqueda.`,
      );
    }

    const docDefinition = getUsersReport({
      title: 'Reporte de Usuarios',
      subTitle: 'Resultados de Búsqueda de Usuarios',
      description: 'usuarios',
      orderSearch: order,
      data: users,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* USERS REPORT BY TERM
  async getUsersByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { 'search-type': searchType, 'search-sub-type': searchSubType } =
      searchTypeAndPaginationDto;

    const users: User[] = await this.userService.findByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    if (!users) {
      throw new NotFoundException(
        `No se encontraron usuarios con estos términos de búsqueda.`,
      );
    }

    let newTerm: string;
    newTerm = term;

    if (searchType === SearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      newTerm = `${GenderNames[genderTerm]}`;
    }

    if (searchType === SearchType.Roles) {
      const rolesArray = term.split('+');

      const rolesInSpanish = rolesArray
        .map((role) => UserRoleNames[role] ?? role)
        .join(' ~ ');

      if (rolesArray.length === 0) {
        throw new NotFoundException(
          `No se encontraron usuarios con estos roles: ${rolesInSpanish}`,
        );
      }

      newTerm = `${rolesInSpanish}`;
    }

    if (searchType === SearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      newTerm = `${RecordStatusNames[recordStatusTerm]} `;
    }

    const docDefinition = getUsersReport({
      title: 'Reporte de Usuarios',
      subTitle: 'Resultados de Búsqueda de Usuarios',
      description: 'usuarios',
      searchTerm: `Termino de búsqueda: ${newTerm}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: users,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? METRICS
  //* MEMBER METRICS REPORT
  async getMemberMetrics(metricsPaginationDto: MetricsPaginationDto) {
    const { year, churchId, types } = metricsPaginationDto;

    const church = await this.churchRepository.findOne({
      where: {
        id: churchId,
      },
    });

    if (!church) {
      throw new NotFoundException(
        `No se encontró ninguna iglesia con este ID: ${churchId}.`,
      );
    }

    const metricsTypesArray = types.split('+');

    // * Search and Set Data
    let membersFluctuationByYearResultData: MonthlyMemberFluctuationResultData[];
    if (metricsTypesArray.includes(MetricSearchType.MembersFluctuationByYear)) {
      membersFluctuationByYearResultData = await this.metricsService.findByTerm(
        `${churchId}&${year}`,
        {
          'search-type': MetricSearchType.MembersFluctuationByYear,
        },
      );
    }

    let membersByBirthMonthResultData: MonthlyMemberResultData[];
    if (metricsTypesArray.includes(MetricSearchType.MembersByBirthMonth)) {
      membersByBirthMonthResultData = await this.metricsService.findByTerm(
        churchId,
        {
          'search-type': MetricSearchType.MembersByBirthMonth,
        },
      );
    }

    let membersByCategoryResultData: MembersByCategoryResultData;
    if (metricsTypesArray.includes(MetricSearchType.MembersByCategory)) {
      membersByCategoryResultData = await this.metricsService.findByTerm(
        churchId,
        {
          'search-type': MetricSearchType.MembersByCategory,
        },
      );
    }

    let membersByCategoryAndGenderResultData: MembersByCategoryAndGenderResultData;
    if (
      metricsTypesArray.includes(MetricSearchType.MembersByCategoryAndGender)
    ) {
      membersByCategoryAndGenderResultData =
        await this.metricsService.findByTerm(churchId, {
          'search-type': MetricSearchType.MembersByCategoryAndGender,
        });
    }

    let membersByRoleAndGenderResultData: MemberByRoleAndGenderResultData;
    if (metricsTypesArray.includes(MetricSearchType.MembersByRoleAndGender)) {
      membersByRoleAndGenderResultData = await this.metricsService.findByTerm(
        churchId,
        {
          'search-type': MetricSearchType.MembersByRoleAndGender,
        },
      );
    }

    let membersByMaritalStatusResultData: MembersByMaritalStatusResultData;
    if (metricsTypesArray.includes(MetricSearchType.MembersByMaritalStatus)) {
      membersByMaritalStatusResultData = await this.metricsService.findByTerm(
        churchId,
        {
          'search-type': MetricSearchType.MembersByMaritalStatus,
        },
      );
    }

    let membersByZoneAndGenderResultData: MembersByZoneResultData;
    if (metricsTypesArray.includes(MetricSearchType.MembersByZoneAndGender)) {
      membersByZoneAndGenderResultData = await this.metricsService.findByTerm(
        `${churchId}&{''}`,
        {
          'search-type': MetricSearchType.MembersByZoneAndGender,
          allZones: true,
        },
      );
    }

    let preachersByZoneAndGenderResultData: PreachersByZoneResultData;
    if (metricsTypesArray.includes(MetricSearchType.PreachersByZoneAndGender)) {
      preachersByZoneAndGenderResultData = await this.metricsService.findByTerm(
        `${churchId}&{''}`,
        {
          'search-type': MetricSearchType.PreachersByZoneAndGender,
          allZones: true,
        },
      );
    }

    let membersByDistrictAndGenderResultData: MembersByDistrictAndGenderResultData;
    if (
      metricsTypesArray.includes(MetricSearchType.MembersByDistrictAndGender)
    ) {
      membersByDistrictAndGenderResultData =
        await this.metricsService.findByTerm(churchId, {
          'search-type': MetricSearchType.MembersByDistrictAndGender,
        });
    }

    let membersByRecordStatusResultData: MembersByRecordStatusResultData;
    if (metricsTypesArray.includes(MetricSearchType.MembersByRecordStatus)) {
      membersByRecordStatusResultData = await this.metricsService.findByTerm(
        churchId,
        {
          'search-type': MetricSearchType.MembersByRecordStatus,
        },
      );
    }

    const docDefinition = getMemberMetricsReport({
      title: 'Reporte de Métricas de Miembro',
      subTitle: 'Resultados de Búsqueda de Métricas de Miembros',
      metricsTypesArray: metricsTypesArray,
      year: year,
      church: church,
      membersFluctuationByYearResultData: membersFluctuationByYearResultData,
      membersByBirthMonthResultData: membersByBirthMonthResultData,
      membersByCategoryResultData: membersByCategoryResultData,
      membersByCategoryAndGenderResultData:
        membersByCategoryAndGenderResultData,
      membersByRoleAndGenderResultData: membersByRoleAndGenderResultData,
      membersByMaritalStatusResultData: membersByMaritalStatusResultData,
      membersByZoneAndGenderResultData: membersByZoneAndGenderResultData,
      preachersByZoneAndGenderResultData: preachersByZoneAndGenderResultData,
      membersByDistrictAndGenderResultData:
        membersByDistrictAndGenderResultData,
      membersByRecordStatusResultData: membersByRecordStatusResultData,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* FAMILY GROUP METRICS REPORT
  async getFamilyGroupMetrics(metricsPaginationDto: MetricsPaginationDto) {
    const { year, churchId, types } = metricsPaginationDto;

    const church = await this.churchRepository.findOne({
      where: {
        id: churchId,
      },
    });

    if (!church) {
      throw new NotFoundException(
        `No se encontró ninguna iglesia con este ID: ${churchId}.`,
      );
    }

    const metricsTypesArray = types.split('+');

    // * Search and Set Data
    let familyGroupsFluctuationByYearResultData: MonthlyFamilyGroupsFluctuationResultData[];
    if (
      metricsTypesArray.includes(MetricSearchType.FamilyGroupsFluctuationByYear)
    ) {
      familyGroupsFluctuationByYearResultData =
        await this.metricsService.findByTerm(`${churchId}&${year}`, {
          'search-type': MetricSearchType.FamilyGroupsFluctuationByYear,
        });
    }

    let familyGroupsByCodeResultData: FamilyGroupsByCodeResultData;
    if (metricsTypesArray.includes(MetricSearchType.FamilyGroupsByCode)) {
      familyGroupsByCodeResultData = await this.metricsService.findByTerm(
        `${churchId}&{''}`,
        {
          'search-type': MetricSearchType.FamilyGroupsByCode,
          allFamilyGroups: true,
          order: 'ASC',
        },
      );
    }

    let familyGroupsByZoneDataResult: FamilyGroupsByZoneResultData;
    if (metricsTypesArray.includes(MetricSearchType.FamilyGroupsByZone)) {
      familyGroupsByZoneDataResult = await this.metricsService.findByTerm(
        `${churchId}&{''}`,
        {
          'search-type': MetricSearchType.FamilyGroupsByZone,
          allZones: true,
          order: 'DESC',
        },
      );
    }

    let familyGroupsByDistrictResultData: FamilyGroupsByDistrictResultData;
    if (metricsTypesArray.includes(MetricSearchType.FamilyGroupsByDistrict)) {
      familyGroupsByDistrictResultData = await this.metricsService.findByTerm(
        `${churchId}&${''}`,
        {
          'search-type': MetricSearchType.FamilyGroupsByDistrict,
          allDistricts: true,
          order: 'DESC',
        },
      );
    }

    let familyGroupsByServiceTimeResultData: FamilyGroupsByServiceTimeResultData;
    if (
      metricsTypesArray.includes(MetricSearchType.FamilyGroupsByServiceTime)
    ) {
      familyGroupsByServiceTimeResultData =
        await this.metricsService.findByTerm(`${churchId}&${''}`, {
          'search-type': MetricSearchType.FamilyGroupsByServiceTime,
          allZones: true,
          order: 'DESC',
        });
    }

    let familyGroupsByRecordStatusResultData: FamilyGroupsByRecordStatusResultData;
    if (
      metricsTypesArray.includes(MetricSearchType.FamilyGroupsByRecordStatus)
    ) {
      familyGroupsByRecordStatusResultData =
        await this.metricsService.findByTerm(`${churchId}&${''}`, {
          'search-type': MetricSearchType.FamilyGroupsByRecordStatus,
          allZones: true,
        });
    }

    const docDefinition = getFamilyGroupMetricsReport({
      title: 'Reporte de Métricas de Grupo Familiar',
      subTitle: 'Resultados de Búsqueda de Métricas de Grupo Familiar',
      metricsTypesArray: metricsTypesArray,
      year: year,
      familyGroupsFluctuationByYearResultData:
        familyGroupsFluctuationByYearResultData,
      familyGroupsByCodeResultData: familyGroupsByCodeResultData,
      familyGroupsByZoneDataResult: familyGroupsByZoneDataResult,
      familyGroupsByDistrictResultData: familyGroupsByDistrictResultData,
      familyGroupsByServiceTimeResultData: familyGroupsByServiceTimeResultData,
      familyGroupsByRecordStatusResultData:
        familyGroupsByRecordStatusResultData,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //* OFFERING INCOME METRICS REPORT
  async getOfferingIncomeMetrics(metricsPaginationDto: MetricsPaginationDto) {
    const { year, startMonth, endMonth, churchId, types } =
      metricsPaginationDto;

    // console.log(year, startMonth, endMonth, churchId, types);

    const church = await this.churchRepository.findOne({
      where: {
        id: churchId,
      },
    });

    if (!church) {
      throw new NotFoundException(
        `No se encontró ninguna iglesia con este ID: ${churchId}.`,
      );
    }

    const metricsTypesArray = types.split('+');

    // OfferingIncomeBySundayService
    // OfferingIncomeByFamilyGroup
    // OfferingIncomeBySundaySchool
    // OfferingIncomeByFastingAndVigil
    // OfferingIncomeByYouthService
    // OfferingIncomeBySpecialOffering
    // OfferingIncomeByChurchGround
    // OfferingIncomeByUnitedService
    // OfferingIncomeByActivities
    // OfferingIncomeAdjustment

    // * Search and Set Data
    let offeringIncomeBySundayServiceResultData: OfferingIncomeBySundayServiceResultData[];
    if (
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeBySundayService)
    ) {
      offeringIncomeBySundayServiceResultData =
        await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            'search-type': MetricSearchType.OfferingIncomeBySundayService,
            isSingleMonth: false,
          },
        );
    }

    let offeringIncomeByFamilyGroupResultData: OfferingIncomeByFamilyGroupResultData[];
    if (
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeBySundayService)
    ) {
      offeringIncomeByFamilyGroupResultData =
        await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            'search-type': MetricSearchType.OfferingIncomeByFamilyGroup,
            isSingleMonth: false,
          },
        );
    }

    let offeringIncomeBySundaySchoolResultData: OfferingIncomeBySundaySchoolResultData[];
    if (
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeBySundaySchool)
    ) {
      offeringIncomeBySundaySchoolResultData =
        await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            'search-type': MetricSearchType.OfferingIncomeBySundaySchool,
            isSingleMonth: false,
          },
        );
    }

    let offeringIncomeByUnitedServiceResultData: OfferingIncomeByUnitedServiceResultData[];
    if (
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByUnitedService)
    ) {
      offeringIncomeByUnitedServiceResultData =
        await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            'search-type': MetricSearchType.OfferingIncomeByUnitedService,
            isSingleMonth: false,
          },
        );
    }

    let offeringIncomeByFastingAndVigilResultData: OfferingIncomeByFastingAndVigilResultData[];
    if (
      metricsTypesArray.includes(
        MetricSearchType.OfferingIncomeByFastingAndVigil,
      )
    ) {
      offeringIncomeByFastingAndVigilResultData =
        await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            'search-type': MetricSearchType.OfferingIncomeByFastingAndVigil,
            isSingleMonth: false,
          },
        );
    }

    let offeringIncomeByYouthServiceResultData: OfferingIncomeByYouthServiceResultData[];
    if (
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByYouthService)
    ) {
      offeringIncomeByYouthServiceResultData =
        await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            'search-type': MetricSearchType.OfferingIncomeByYouthService,
            isSingleMonth: false,
          },
        );
    }

    let offeringIncomeBySpecialOfferingResultData: OfferingIncomeBySpecialOfferingResultData[];
    if (
      metricsTypesArray.includes(
        MetricSearchType.OfferingIncomeBySpecialOffering,
      )
    ) {
      offeringIncomeBySpecialOfferingResultData =
        await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            'search-type': MetricSearchType.OfferingIncomeBySpecialOffering,
            isSingleMonth: false,
          },
        );
    }

    let offeringIncomeByChurchGroundResultData: OfferingIncomeByChurchGroundResultData[];
    if (
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByChurchGround)
    ) {
      offeringIncomeByChurchGroundResultData =
        await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            'search-type': MetricSearchType.OfferingIncomeByChurchGround,
            isSingleMonth: false,
          },
        );
    }

    let offeringIncomeByActivitiesResultData: OfferingIncomeByActivitiesResultData[];
    if (
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByActivities)
    ) {
      offeringIncomeByActivitiesResultData =
        await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            'search-type': MetricSearchType.OfferingIncomeByActivities,
            isSingleMonth: false,
          },
        );
    }

    let offeringIncomeByIncomeAdjustmentResultData: OfferingIncomeByIncomeAdjustmentResultData[];
    if (metricsTypesArray.includes(MetricSearchType.OfferingIncomeAdjustment)) {
      offeringIncomeByIncomeAdjustmentResultData =
        await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            'search-type': MetricSearchType.OfferingIncomeAdjustment,
            isSingleMonth: false,
          },
        );
    }

    const docDefinition = getOfferingIncomeMetricsReport({
      title: 'Reporte de Métricas de Ingresos de Ofrenda',
      subTitle: 'Resultados de Búsqueda de Métricas de Ingresos de Ofrendas',
      metricsTypesArray: metricsTypesArray,
      year: year,
      startMonth: startMonth,
      endMonth: endMonth,
      offeringIncomeBySundayServiceResultData:
        offeringIncomeBySundayServiceResultData,
      offeringIncomeByFamilyGroupResultData:
        offeringIncomeByFamilyGroupResultData,
      offeringIncomeBySundaySchoolResultData:
        offeringIncomeBySundaySchoolResultData,
      offeringIncomeByUnitedServiceResultData:
        offeringIncomeByUnitedServiceResultData,
      offeringIncomeByFastingAndVigilResultData:
        offeringIncomeByFastingAndVigilResultData,
      offeringIncomeByYouthServiceResultData:
        offeringIncomeByYouthServiceResultData,
      offeringIncomeBySpecialOfferingResultData:
        offeringIncomeBySpecialOfferingResultData,
      offeringIncomeByChurchGroundResultData:
        offeringIncomeByChurchGroundResultData,
      offeringIncomeByActivitiesResultData:
        offeringIncomeByActivitiesResultData,
      offeringIncomeByIncomeAdjustmentResultData:
        offeringIncomeByIncomeAdjustmentResultData,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }
}
