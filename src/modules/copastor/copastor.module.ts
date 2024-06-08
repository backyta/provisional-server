import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Copastor } from '@/modules/copastor/entities';

import { CopastorService } from '@/modules/copastor/copastor.service';
import { CopastorController } from '@/modules/copastor/copastor.controller';

import { ZoneModule } from '@/modules/zone/zone.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyHouseModule } from '@/modules/family-house/family-house.module';

@Module({
  controllers: [CopastorController],
  providers: [CopastorService],
  imports: [
    TypeOrmModule.forFeature([Copastor]),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => FamilyHouseModule),
    forwardRef(() => DiscipleModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, CopastorService],
})
export class CopastorModule {}
