import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import {
  OfferingIncomeCreateSubType,
  OfferingIncomeCreateType,
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
    example: OfferingIncomeCreateType.Offering,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  type: string;

  @ApiProperty({
    example: OfferingIncomeCreateSubType.ChurchGround,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  subType: string;
}
