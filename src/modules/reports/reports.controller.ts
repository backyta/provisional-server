import {
  Get,
  Res,
  Param,
  Query,
  Controller,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';

import {
  PaginationDto,
  MetricsPaginationDto,
  SearchAndPaginationDto,
} from '@/common/dtos';
import { ReportsService } from '@/modules/reports/reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  //* STUDENT CERTIFICATE
  @Get('student-certificate/:id')
  async getStudyCertificateById(
    @Res() response: Response,
    @Param('id', ParseUUIDPipe) studentId: string,
  ) {
    const pdfDoc = await this.reportsService.getStudyCertificateById(studentId);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'student-certificate.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? CHURCHES
  //* CHURCHES GENERAL REPORT
  @Get('churches')
  async getGeneralChurches(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralChurches(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'general-churches-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* PASTORS GENERAL REPORT
  @Get('churches/:term')
  async getChurchesByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getChurchesByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'churches-by-term-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? PASTORS
  //* PASTORS GENERAL REPORT
  @Get('pastors')
  async getGeneralPastors(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralPastors(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'general-pastors-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* PASTORS GENERAL REPORT
  @Get('pastors/:term')
  async getPastorsByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getPastorsByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'pastors-by-term-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? COPASTORS
  //* COPASTORS GENERAL REPORT
  @Get('copastors')
  async getGeneralCopastors(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralCopastors(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'general-copastors-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* COPASTORS GENERAL REPORT
  @Get('copastors/:term')
  async getCopastorsByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getCopastorsByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'copastors-by-term-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? SUPERVISORS
  //* SUPERVISORS GENERAL REPORT
  @Get('supervisors')
  async getGeneralSupervisors(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getGeneralSupervisors(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'general-supervisors-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* SUPERVISORS GENERAL REPORT
  @Get('supervisors/:term')
  async getSupervisorsByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getSupervisorsByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'supervisors-by-term-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? PREACHERS
  //* PREACHERS GENERAL REPORT
  @Get('preachers')
  async getGeneralPreachers(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralPreachers(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'general-preachers-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* PREACHERS GENERAL REPORT
  @Get('preachers/:term')
  async getPreachersByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getPreachersByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'preachers-by-term-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? DISCIPLES
  //* DISCIPLES GENERAL REPORT
  @Get('disciples')
  async getGeneralDisciples(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralDisciples(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'general-disciples-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* DISCIPLES GENERAL REPORT
  @Get('disciples/:term')
  async getDisciplesByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getDisciplesByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'disciples-by-term-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? ZONES
  //* ZONES GENERAL REPORT
  @Get('zones')
  async getGeneralZones(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralZones(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'general-zones-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* ZONES BY TERM REPORT
  @Get('zones/:term')
  async getZonesByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getZonesByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'zones-by-term-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? FAMILY GROUPS
  //* FAMILY GROUPS GENERAL REPORT
  @Get('family-groups')
  async getGeneralFamilyGroups(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getGeneralFamilyGroups(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'general-family-groups-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* FAMILY GROUPS BY TERM REPORT
  @Get('family-groups/:term')
  async getFamilyGroupsByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getFamilyGroupsByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'family-groups-by-term-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? OFFERING INCOME
  //* OFFERING INCOME GENERAL REPORT
  @Get('offering-income')
  async getGeneralOfferingIncome(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getGeneralOfferingIncome(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'general-offering-income-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* OFFERING INCOME BY TERM REPORT
  @Get('offering-income/:term')
  async getOfferingIncomeByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getOfferingIncomeByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'offering-income-by-term-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? OFFERING EXPENSES
  //* OFFERING EXPENSES GENERAL REPORT
  @Get('offering-expenses')
  async getGeneralOfferingExpenses(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getGeneralOfferingExpenses(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'general-offering-expenses-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* OFFERING EXPENSES BY TERM REPORT
  @Get('offering-expenses/:term')
  async getOfferingExpensesByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getOfferingExpensesByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'offering-expenses-by-term-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? USERS
  //* USERS GENERAL REPORT
  @Get('users')
  async getGeneralUsers(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralUsers(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'general-users-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* USERS BY TERM REPORT
  @Get('users/:term')
  async getUsersByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getUsersByTerm(
      term,
      searchTypeAndPaginationDto,
    );

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'users-by-term-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? METRICS
  //* MEMBER METRICS REPORT
  @Get('member-metrics')
  async getMemberMetrics(
    @Res() response: Response,
    @Query() paginationDto: MetricsPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getMemberMetrics(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');

    pdfDoc.info.Title = 'member-metrics-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* FAMILY GROUP METRICS REPORT
  @Get('family-group-metrics')
  async getFamilyGroupMetrics(
    @Res() response: Response,
    @Query() paginationDto: MetricsPaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getFamilyGroupMetrics(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');

    pdfDoc.info.Title = 'family-group-metrics-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* OFFERING INCOME METRICS REPORT
  @Get('offering-income-metrics')
  async getOfferingIncomeMetrics(
    @Res() response: Response,
    @Query() paginationDto: MetricsPaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getOfferingIncomeMetrics(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');

    pdfDoc.info.Title = 'offering-income-metrics-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* OFFERING EXPENSE METRICS REPORT
  @Get('offering-expense-metrics')
  async getOfferingExpenseMetrics(
    @Res() response: Response,
    @Query() paginationDto: MetricsPaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getOfferingExpenseMetrics(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');

    pdfDoc.info.Title = 'offering-expense-metrics-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* FINANCIAL BALANCE COMPARATIVE METRICS REPORT
  @Get('financial-balance-comparative-metrics')
  async getFinancialBalanceComparativeMetrics(
    @Res() response: Response,
    @Query() paginationDto: MetricsPaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getFinancialBalanceComparativeMetrics(
        paginationDto,
      );

    response.setHeader('Content-Type', 'application/pdf');

    pdfDoc.info.Title = 'financial-balance-comparative-metrics-report.pdf';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }
}
