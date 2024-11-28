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
    description: 'Type of file to be used for the image path.',
  })
  @IsEnum(OfferingFileType)
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  fileType: string;

  @ApiProperty({
    example: OfferingIncomeCreationType.Offering,
    description: 'Type of offering to be used for the image path.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  offeringType: string;

  @ApiProperty({
    example: OfferingIncomeCreationSubType.ChurchGround,
    description: 'Sub-type of offering to be used for the image path.',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  offeringSubType?: string;
}
