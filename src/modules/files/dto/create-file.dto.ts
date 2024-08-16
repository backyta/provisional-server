import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  OfferingIncomeCreationSubType,
  OfferingIncomeCreationType,
} from '@/modules/offering/income/enums';

export class CreateFileDto {
  @ApiProperty({
    example: 'Ingresos',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  action: string;

  @ApiProperty({
    example: OfferingIncomeCreationType.Offering,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  type: string;

  @ApiProperty({
    example: OfferingIncomeCreationSubType.ChurchGround,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  subType?: string;
}
