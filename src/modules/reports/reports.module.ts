import { Module } from '@nestjs/common';

import { ReportsService } from '@/modules/reports/reports.service';
import { ReportsController } from '@/modules/reports/reports.controller';

import { ZoneModule } from '@/modules/zone/zone.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { MemberModule } from '@/modules/member/member.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';

import { PrinterModule } from '@/modules/printer/printer.module';

import { UserModule } from '@/modules/user/user.module';
import { OfferingIncomeModule } from '@/modules/offering/income/offering-income.module';
import { OfferingExpenseModule } from '@/modules/offering/expense/offering-expense.module';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  imports: [
    PrinterModule,
    ChurchModule,
    MemberModule,
    PastorModule,
    CopastorModule,
    SupervisorModule,
    PreacherModule,
    DiscipleModule,
    ZoneModule,
    FamilyGroupModule,
    OfferingIncomeModule,
    OfferingExpenseModule,
    UserModule,
  ],
  exports: [],
})
export class ReportsModule {}
