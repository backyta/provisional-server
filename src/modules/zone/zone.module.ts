import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Zone } from '@/modules/zone/entities';
import { ZoneService } from '@/modules/zone/zone.service';
import { ZoneController } from '@/modules/zone/zone.controller';

import { AuthModule } from '@/modules/auth/auth.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { ChurchModule } from '@/modules/church/church.module';

@Module({
  controllers: [ZoneController],
  providers: [ZoneService],
  imports: [
    TypeOrmModule.forFeature([Zone]),
    ChurchModule,
    forwardRef(() => PastorModule),
    CopastorModule,
    SupervisorModule,
    AuthModule,
  ],
  exports: [TypeOrmModule, ZoneService],
})
export class ZoneModule {}
