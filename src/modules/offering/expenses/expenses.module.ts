import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Expense } from '@/modules/offering/expenses/entities';
import { ExpensesService } from '@/modules/offering/expenses/expenses.service';
import { ExpensesController } from '@/modules/offering/expenses/expenses.controller';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService],
  imports: [TypeOrmModule.forFeature([Expense])],
})
export class ExpensesModule {}
