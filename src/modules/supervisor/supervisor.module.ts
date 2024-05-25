import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { Supervisor } from '@/modules/supervisor/entities';
import { SupervisorService } from '@/modules/supervisor/supervisor.service';
import { SupervisorController } from '@/modules/supervisor/supervisor.controller';

import { PastorModule } from '@/modules/pastor/pastor.module';
import { ChurchModule } from '@/modules/church/church.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';

@Module({
  controllers: [SupervisorController],
  providers: [SupervisorService],
  imports: [
    TypeOrmModule.forFeature([Supervisor]),
    ChurchModule,
    forwardRef(() => PastorModule),
    CopastorModule,
    AuthModule,
  ],
  exports: [TypeOrmModule, SupervisorService],
})
export class SupervisorModule {}
