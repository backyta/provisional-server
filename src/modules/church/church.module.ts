import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { Church } from '@/modules/church/entities';
import { ChurchService } from '@/modules/church/church.service';
import { ChurchController } from '@/modules/church/church.controller';

@Module({
  controllers: [ChurchController],
  providers: [ChurchService],
  imports: [TypeOrmModule.forFeature([Church]), AuthModule],
  exports: [TypeOrmModule, ChurchService],
})
export class ChurchModule {}
