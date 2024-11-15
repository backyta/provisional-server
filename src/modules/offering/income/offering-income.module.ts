import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OfferingIncome } from '@/modules/offering/income/entities';
import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';
import { OfferingIncomeController } from '@/modules/offering/income/offering-income.controller';

import { ZoneModule } from '@/modules/zone/zone.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';

@Module({
  controllers: [OfferingIncomeController],
  providers: [OfferingIncomeService],
  imports: [
    TypeOrmModule.forFeature([OfferingIncome]),
    AuthModule,
    ZoneModule,
    ChurchModule,
    PastorModule,
    DiscipleModule,
    PreacherModule,
    CopastorModule,
    SupervisorModule,
    FamilyGroupModule,
  ],
  exports: [TypeOrmModule, OfferingIncomeService],
})
export class OfferingIncomeModule {}
