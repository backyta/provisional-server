import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';

import { Church } from '@/modules/church/entities';
import { ChurchService } from '@/modules/church/church.service';
import { ChurchController } from '@/modules/church/church.controller';

import { ZoneModule } from '@/modules/zone/zone.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';
import { OfferingIncomeModule } from '@/modules/offering/income/offering-income.module';

@Module({
  controllers: [ChurchController],
  providers: [ChurchService],
  imports: [
    TypeOrmModule.forFeature([Church]),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => FamilyGroupModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => DiscipleModule),
    forwardRef(() => OfferingIncomeModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, ChurchService],
})
export class ChurchModule {}
