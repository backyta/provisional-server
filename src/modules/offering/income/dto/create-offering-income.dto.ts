import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsArray,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';

import {
  CurrencyType,
  OfferingInactivationReason,
} from '@/modules/offering/shared/enums';

import {
  MemberType,
  OfferingIncomeCreationType,
  OfferingIncomeCreationSubType,
  OfferingIncomeCreationCategory,
  OfferingIncomeCreationShiftType,
} from '@/modules/offering/income/enums';
import { Gender, RecordStatus } from '@/common/enums';

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
  @IsOptional()
  subType?: string;

  @ApiProperty({
    example: OfferingIncomeCreationCategory.OfferingBox,
  })
  @IsOptional()
  category?: string;

  //? For new Donator
  @ApiProperty({
    example: true,
    description: 'Do you want create a new donor?',
  })
  @IsOptional()
  @IsBoolean()
  isNewDonor?: boolean;

  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsOptional()
  donorId?: string;

  @ApiProperty({
    example: 'John Martin',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  donorFirstName?: string;

  @ApiProperty({
    example: 'Rojas Castro',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  donorLastName?: string;

  @ApiProperty({
    example: Gender.Male,
  })
  @IsEnum(Gender, {
    message:
      'El género debe ser uno de los siguientes valores: Masculino o Femenino',
  })
  @IsOptional()
  donorGender?: string;

  @ApiProperty({
    example: '1990-12-23',
  })
  @IsString()
  @IsOptional()
  donorBirthDate?: Date;

  @ApiProperty({
    example: '+51 999333555',
  })
  @IsString()
  @IsOptional()
  donorPhoneNumber?: string;

  @ApiProperty({
    example: 'example@example.com',
  })
  @IsEmail()
  @IsOptional()
  donorEmail?: string;

  @ApiProperty({
    example: 'Peru',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(40)
  donorOriginCountry: string;

  @ApiProperty({
    example: 'Italia',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(40)
  donorResidenceCountry: string;

  @ApiProperty({
    example: 'Roma',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(40)
  donorResidenceCity: string;

  @ApiProperty({
    example: 'A 2 cuadras al colegio',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(40)
  donorPostalCode: string;

  //* ------------------------------------------------------------------ //

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
  @MaxLength(500)
  comments?: string;

  @ApiProperty({
    example: [
      `https://res.cloudinary.com/example/image/upload/v111136172/income/offering/sunday_service/nsdhjntwknysxkkn8zfu.png`,
      `https://res.cloudinary.com/example/image/upload/v111125736/income/offering/sunday_service/nsdhjntwknysxkkn8zfu.png`,
    ],
  })
  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @ApiProperty({
    example: OfferingInactivationReason.TypeSelectionError,
  })
  @IsEnum(OfferingInactivationReason)
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
