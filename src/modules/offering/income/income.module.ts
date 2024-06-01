import { Module } from '@nestjs/common';
import { IncomeService } from './income.service';
import { IncomeController } from './income.controller';
import { Income } from '@/modules/offering/income/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [IncomeController],
  providers: [IncomeService],
  imports: [TypeOrmModule.forFeature([Income])],
})
export class IncomeModule {}
