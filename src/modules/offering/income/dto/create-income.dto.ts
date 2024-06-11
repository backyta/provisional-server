import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { CurrencyType } from '@/modules/offering/shared/enums';

import {
  SubTypesOfferingIncome,
  TypesOfferingIncome,
} from '@/modules/offering/income/enums';

export class CreateIncomeDto {
  @ApiProperty({
    example: 'offering',
  })
  @IsEnum(TypesOfferingIncome)
  type: string;

  @ApiProperty({
    enum: SubTypesOfferingIncome,
  })
  @IsEnum(SubTypesOfferingIncome)
  @IsOptional()
  subType?: string;

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

  // Relations
  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  theirFamilyHouse?: string;

  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  theirContributor?: string;

  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  theirZone?: string;
}
