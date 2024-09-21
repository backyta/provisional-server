import { Module } from '@nestjs/common';

import { MetricsService } from '@/modules/metrics/metrics.service';
import { MetricsController } from '@/modules/metrics/metrics.controller';

import { AuthModule } from '@/modules/auth/auth.module';

import { ZoneModule } from '@/modules/zone/zone.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';

@Module({
  providers: [MetricsService],
  controllers: [MetricsController],
  imports: [
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
export class MetricsModule {}
