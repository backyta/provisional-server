import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';

import { FamilyHouse } from '@/modules/family-house/entities';
import { FamilyHouseService } from '@/modules/family-house/family-house.service';
import { FamilyHouseController } from '@/modules/family-house/family-house.controller';

import { AuthModule } from '@/modules/auth/auth.module';
import { ZoneModule } from '@/modules/zone/zone.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { ChurchModule } from '@/modules/church/church.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';

@Module({
  controllers: [FamilyHouseController],
  providers: [FamilyHouseService],
  imports: [
    TypeOrmModule.forFeature([FamilyHouse]),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => DiscipleModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, FamilyHouseService],
})
export class FamilyHouseModule {}
