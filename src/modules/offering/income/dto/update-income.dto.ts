import { PartialType } from '@nestjs/swagger';
import { CreateIncomeDto } from '@/modules/offering/income/dto';

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {}
