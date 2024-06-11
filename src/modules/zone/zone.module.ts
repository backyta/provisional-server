import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Zone } from '@/modules/zone/entities';
import { ZoneService } from '@/modules/zone/zone.service';
import { ZoneController } from '@/modules/zone/zone.controller';

import { AuthModule } from '@/modules/auth/auth.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyHouseModule } from '@/modules/family-house/family-house.module';

@Module({
  controllers: [ZoneController],
  providers: [ZoneService],
  imports: [
    TypeOrmModule.forFeature([Zone]),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => FamilyHouseModule),
    forwardRef(() => DiscipleModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, ZoneService],
})
export class ZoneModule {}
