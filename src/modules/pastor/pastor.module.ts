import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';

import { Pastor } from '@/modules/pastor/entities';
import { PastorService } from '@/modules/pastor/pastor.service';
import { PastorController } from '@/modules/pastor/pastor.controller';

import { ZoneModule } from '@/modules/zone/zone.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ChurchModule } from '@/modules/church/church.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyHouseModule } from '@/modules/family-house/family-house.module';

@Module({
  controllers: [PastorController],
  providers: [PastorService],
  imports: [
    TypeOrmModule.forFeature([Pastor]),
    forwardRef(() => ChurchModule),
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
