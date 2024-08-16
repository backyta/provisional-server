import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OfferingIncome } from '@/modules/offering/income/entities';
import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';
import { OfferingIncomeController } from '@/modules/offering/income/offering-income.controller';
import { AuthModule } from '@/modules/auth/auth.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { ZoneModule } from '@/modules/zone/zone.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';

@Module({
  controllers: [OfferingIncomeController],
  providers: [OfferingIncomeService],
  imports: [
    TypeOrmModule.forFeature([OfferingIncome]),
    ChurchModule,
    PastorModule,
    CopastorModule,
    SupervisorModule,
    ZoneModule,
    PreacherModule,
    FamilyGroupModule,
    DiscipleModule,
    AuthModule,
  ],
})
export class OfferingIncomeModule {}

//NOTE : ver donde se necesita hacer la dependencia cíclica porque no sera en todos
