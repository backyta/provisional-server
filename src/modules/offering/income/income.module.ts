import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Income } from '@/modules/offering/income/entities';
import { IncomeService } from '@/modules/offering/income/income.service';
import { IncomeController } from '@/modules/offering/income/income.controller';

@Module({
  controllers: [IncomeController],
  providers: [IncomeService],
  imports: [TypeOrmModule.forFeature([Income])],
})
export class IncomeModule {}
