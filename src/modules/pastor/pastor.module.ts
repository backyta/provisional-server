import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';
import { ChurchModule } from '@/modules/church/church.module';

import { Pastor } from '@/modules/pastor/entities';
import { PastorService } from '@/modules/pastor/pastor.service';
import { PastorController } from '@/modules/pastor/pastor.controller';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { ZoneModule } from '@/modules/zone/zone.module';
import { FamilyHouseModule } from '@/modules/family-house/family-house.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';

@Module({
  controllers: [PastorController],
  providers: [PastorService],
  imports: [
    TypeOrmModule.forFeature([Pastor]),
    ChurchModule,
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => FamilyHouseModule),
    forwardRef(() => DiscipleModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, PastorService],
})
export class PastorModule {}
