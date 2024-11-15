import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import {
  OfferingIncomeCreationType,
  OfferingIncomeCreationSubType,
} from '@/modules/offering/income/enums';

import { OfferingFileType } from '@/common/enums';

export class CreateFileDto {
  @ApiProperty({
    example: OfferingFileType.Income,
  })
  @IsEnum(OfferingFileType)
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  fileType: string;

  @ApiProperty({
    example: OfferingIncomeCreationType.Offering,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  offeringType: string;

  @ApiProperty({
    example: OfferingIncomeCreationSubType.ChurchGround,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  offeringSubType?: string;
}

// TODO : hacer description para la documentacion
