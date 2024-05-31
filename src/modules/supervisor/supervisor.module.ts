import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { Supervisor } from '@/modules/supervisor/entities';
import { SupervisorService } from '@/modules/supervisor/supervisor.service';
import { SupervisorController } from '@/modules/supervisor/supervisor.controller';

import { PastorModule } from '@/modules/pastor/pastor.module';
import { ChurchModule } from '@/modules/church/church.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { ZoneModule } from '@/modules/zone/zone.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { FamilyHouseModule } from '@/modules/family-house/family-house.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';

@Module({
  controllers: [SupervisorController],
  providers: [SupervisorService],
  imports: [
    TypeOrmModule.forFeature([Supervisor]),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => FamilyHouseModule),
    forwardRef(() => DiscipleModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, SupervisorService],
})
export class SupervisorModule {}
