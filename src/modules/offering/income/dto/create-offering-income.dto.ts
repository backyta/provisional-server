import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { CurrencyType } from '@/modules/offering/shared/enums';

import {
  OfferingIncomeCreationSubType,
  OfferingIncomeCreationType,
} from '@/modules/offering/income/enums';

export class CreateOfferingIncomeDto {
  //* General data
  @ApiProperty({
    example: OfferingIncomeCreationType.Offering,
  })
  @IsEnum(OfferingIncomeCreationType)
  type: string;

  @ApiProperty({
    example: OfferingIncomeCreationSubType.FamilyGroup,
  })
  @IsEnum(OfferingIncomeCreationSubType)
  @IsOptional()
  subType?: string;

  @ApiProperty({
    example: 'tarde',
  })
  @IsString()
  shift: string;

  @ApiProperty({
    example: '50',
  })
  @IsNotEmpty()
  amount: string | number;

  @ApiProperty({
    example: CurrencyType.Sol,
  })
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    example: '1990/12/23',
  })
  @IsString()
  @IsNotEmpty()
  date: string | Date;

  @ApiProperty({
    example: 'Comments.....',
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  comments?: string;

  @ApiProperty({
    example: [
      'http://... url created whit file service',
      'http://... url created whit file service',
    ],
  })
  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @ApiProperty({
    example: 'Reason is .....',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  reasonElimination?: string;

  @ApiProperty({
    example: 'Pastor',
  })
  @IsString()
  @IsOptional()
  memberType?: string;

  //* Relations
  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsOptional()
  familyGroupId?: string;

  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsOptional()
  memberId?: string;

  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsOptional()
  zoneId?: string;
}
