import { PartialType } from '@nestjs/swagger';
import { CreateExpenseDto } from '@/modules/offering/expenses/dto';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
