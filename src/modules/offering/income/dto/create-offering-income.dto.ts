import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

import {
  CurrencyType,
  OfferingReasonEliminationType,
} from '@/modules/offering/shared/enums';

import {
  MemberType,
  OfferingIncomeCreationType,
  OfferingIncomeCreationSubType,
  OfferingIncomeCreationShiftType,
} from '@/modules/offering/income/enums';
import { RecordStatus } from '@/common/enums';

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
    example: OfferingIncomeCreationShiftType.Day,
  })
  @IsOptional()
  @IsString()
  shift?: string;

  @ApiProperty({
    example: '50',
  })
  @IsNotEmpty()
  amount: string | number;

  @ApiProperty({
    example: CurrencyType.PEN,
  })
  @IsEnum(CurrencyType)
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    example: '1990/12/23',
  })
  @IsNotEmpty()
  date: Date;

  @ApiProperty({
    example: 'Example comments.....',
  })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  comments?: string;

  @ApiProperty({
    example: [
      `https://res.cloudinary.com/example/image/upload/v111136172/income/offering/sunday_worship/nsdhjntwknysxkkn8zfu.png`,
      `https://res.cloudinary.com/example/image/upload/v111125736/income/offering/sunday_worship/nsdhjntwknysxkkn8zfu.png`,
    ],
  })
  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @ApiProperty({
    example: OfferingReasonEliminationType.TypeSelectionError,
  })
  @IsEnum(OfferingReasonEliminationType)
  @MinLength(1)
  @MaxLength(50)
  @IsOptional()
  reasonElimination?: string;

  @ApiProperty({
    example: RecordStatus.Active,
  })
  @IsString()
  @IsEnum(RecordStatus, {
    message:
      'El estado de registro debe ser uno de los siguientes valores: Activo o Inactivo',
  })
  @IsOptional()
  recordStatus?: string;

  @ApiProperty({
    example: MemberType.Pastor,
  })
  @IsOptional()
  @IsString()
  memberType?: string | undefined;

  //* Relations
  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsOptional()
  churchId?: string;

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
