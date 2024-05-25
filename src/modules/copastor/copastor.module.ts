import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { ChurchModule } from '@/modules/church/church.module';

import { Copastor } from '@/modules/copastor/entities';
import { CopastorService } from '@/modules/copastor/copastor.service';
import { CopastorController } from '@/modules/copastor/copastor.controller';

@Module({
  controllers: [CopastorController],
  providers: [CopastorService],
  imports: [
    TypeOrmModule.forFeature([Copastor]),
    ChurchModule,
    forwardRef(() => PastorModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, CopastorService],
})
export class CopastorModule {}
