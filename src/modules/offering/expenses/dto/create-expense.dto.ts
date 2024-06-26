import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { CurrencyType } from '@/modules/offering/shared/enums';

import {
  TypesOfferingExpense,
  SubTypesOfferingExpense,
} from '@/modules/offering/expenses/enums';

export class CreateExpenseDto {
  @ApiProperty({
    enum: TypesOfferingExpense,
  })
  @IsEnum(TypesOfferingExpense)
  type: string;

  @ApiProperty({
    enum: SubTypesOfferingExpense,
  })
  @IsEnum(SubTypesOfferingExpense)
  @IsNotEmpty()
  subType: string;

  @ApiProperty({
    example: 50,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    enum: CurrencyType,
  })
  @IsEnum(CurrencyType)
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    example: '1990/12/23',
  })
  @IsString()
  @IsNotEmpty()
  date: string | Date;

  @ApiProperty({
    example: 'Comments .....',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  comments?: string;

  @ApiProperty({
    example: 'http://... url created whit file service',
  })
  @IsString()
  @IsOptional()
  urlFiles?: string;

  @ApiProperty({
    example: 'Reason is .....',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  reasonElimination?: string;
}
