import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';
import { SearchSubTypeNames, SearchTypeNames } from '@/common/enums';

import { Member } from '@/modules/member/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Disciple } from '@/modules/disciple/entities';

import { DateFormatter } from '@/modules/reports/helpers';
import { PrinterService } from '@/modules/printer/printer.service';
import {
  getZonesReport,
  getMembersReport,
  getChurchesReport,
  getFamilyGroupsReport,
  getStudyCertificateByIdReport,
  getOfferingIncomeReport,
  getOfferingExpensesReport,
  getUsersReport,
} from '@/modules/reports/reports-types';

import { PastorService } from '@/modules/pastor/pastor.service';
import { ChurchService } from '@/modules/church/church.service';
import { DiscipleService } from '@/modules/disciple/disciple.service';
import { CopastorService } from '@/modules/copastor/copastor.service';
import { PreacherService } from '@/modules/preacher/preacher.service';
import { SupervisorService } from '@/modules/supervisor/supervisor.service';
import { FamilyGroupService } from '@/modules/family-group/family-group.service';

import { Zone } from '@/modules/zone/entities';
import { Church } from '@/modules/church/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { ZoneService } from '@/modules/zone/zone.service';
import { Supervisor } from '@/modules/supervisor/entities';
import { FamilyGroup } from '@/modules/family-group/entities';
import { OfferingIncome } from '../offering/income/entities';
import { OfferingIncomeService } from '../offering/income/offering-income.service';
import { OfferingExpenseService } from '../offering/expense/offering-expense.service';
import { OfferingExpense } from '../offering/expense/entities';
import { User } from '../user/entities';
import { UserService } from '../user/user.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger('ReportsService');

  constructor(
    private readonly printerService: PrinterService,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

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

    const docDefinition = getChurchesReport({
      title: 'Reporte de Iglesias',
      subTitle: 'Resultados de Búsqueda de Iglesias',
      description: 'iglesias',
      searchTerm: `Termino de búsqueda: ${term}`,
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

    const docDefinition = getMembersReport({
      title: 'Reporte de Pastores',
      subTitle: 'Resultados de Búsqueda de Pastores',
      description: 'pastores',
      searchTerm: `Termino de búsqueda: ${term}`,
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

    const docDefinition = getMembersReport({
      title: 'Reporte de Co-Pastores',
      subTitle: 'Resultados de Búsqueda de Co-Pastores',
      description: 'co-pastores',
      searchTerm: `Termino de búsqueda: ${term}`,
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

    const docDefinition = getMembersReport({
      title: 'Reporte de Supervisores',
      subTitle: 'Resultados de Búsqueda de Supervisores',
      description: 'supervisores',
      searchTerm: `Termino de búsqueda: ${term}`,
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

    const docDefinition = getMembersReport({
      title: 'Reporte de Predicadores',
      subTitle: 'Resultados de Búsqueda de Predicadores',
      description: 'predicadores',
      searchTerm: `Termino de búsqueda: ${term}`,
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

    const docDefinition = getMembersReport({
      title: 'Reporte de Discípulos',
      subTitle: 'Resultados de Búsqueda de Discípulos',
      description: 'discípulos',
      searchTerm: `Termino de búsqueda: ${term}`,
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

    const docDefinition = getZonesReport({
      title: 'Reporte de Zonas',
      subTitle: 'Resultados de Búsqueda de Zonas',
      description: 'zonas',
      searchTerm: `Termino de búsqueda: ${term}`,
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

    const docDefinition = getFamilyGroupsReport({
      title: 'Reporte de Grupos Familiares',
      subTitle: 'Resultados de Búsqueda de Grupos Familiares',
      description: 'grupos familiares',
      searchTerm: `Termino de búsqueda: ${term}`,
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

    const docDefinition = getOfferingIncomeReport({
      title: 'Reporte de Ingresos de Ofrenda',
      subTitle: 'Resultados de Búsqueda de Ingresos de Ofrenda',
      description: 'registros',
      searchTerm: `Termino de búsqueda: ${term}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: offeringIncome,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }

  //? OFFERING EXPENSES
  //* GENERAL EXPENSES INCOME REPORT
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

    const docDefinition = getOfferingExpensesReport({
      title: 'Reporte de Salidas de Ofrenda',
      subTitle: 'Resultados de Búsqueda de Salidas de Ofrenda',
      description: 'registros',
      searchTerm: `Termino de búsqueda: ${term}`,
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

  //* OFFERING EXPENSES REPORT BY TERM
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

    const docDefinition = getUsersReport({
      title: 'Reporte de Usuarios',
      subTitle: 'Resultados de Búsqueda de Usuarios',
      description: 'usuarios',
      searchTerm: `Termino de búsqueda: ${term}`,
      searchType: `Tipo de búsqueda: ${SearchTypeNames[searchType]}`,
      searchSubType: `Sub-tipo de búsqueda: ${SearchSubTypeNames[searchSubType] ?? 'S/N'}`,
      data: users,
    });

    const doc = this.printerService.createPdf(docDefinition);

    return doc;
  }
}
