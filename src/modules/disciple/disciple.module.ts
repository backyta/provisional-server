import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';

import { Disciple } from '@/modules/disciple/entities';
import { DiscipleService } from '@/modules/disciple/disciple.service';
import { DiscipleController } from '@/modules/disciple/disciple.controller';

import { ZoneModule } from '@/modules/zone/zone.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';

@Module({
  controllers: [DiscipleController],
  providers: [DiscipleService],
  imports: [
    TypeOrmModule.forFeature([Disciple]),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => FamilyGroupModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, DiscipleService],
})
export class DiscipleModule {}
