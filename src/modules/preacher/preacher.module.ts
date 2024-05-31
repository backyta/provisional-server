import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { Preacher } from '@/modules/preacher/entities';
import { PreacherService } from '@/modules/preacher/preacher.service';
import { PreacherController } from '@/modules/preacher/preacher.controller';

import { PastorModule } from '@/modules/pastor/pastor.module';
import { ChurchModule } from '@/modules/church/church.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { ZoneModule } from '@/modules/zone/zone.module';
import { FamilyHouseModule } from '@/modules/family-house/family-house.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';

@Module({
  controllers: [PreacherController],
  providers: [PreacherService],
  imports: [
    TypeOrmModule.forFeature([Preacher]),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => FamilyHouseModule),
    forwardRef(() => DiscipleModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, PreacherService],
})
export class PreacherModule {}
