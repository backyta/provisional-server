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
  OfferingExpenseSearchType,
  OfferingExpenseSearchSubType,
} from '@/modules/offering/expense/enums';
import { RecordStatus } from '@/common/enums';

export class CreateOfferingExpenseDto {
  @ApiProperty({
    example: OfferingExpenseSearchType.OperationalExpenses,
  })
  @IsEnum(OfferingExpenseSearchType)
  type: string;

  @ApiProperty({
    example: OfferingExpenseSearchSubType.VenueRental,
  })
  @IsEnum(OfferingExpenseSearchSubType)
  @IsOptional()
  subType: string;

  @ApiProperty({
    example: 100,
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
      `https://res.cloudinary.com/example/image/upload/v1111737494/expense/operative_expense/venue_rental/x6224doorez3s5vwlvpkh.png`,
      `https://res.cloudinary.com/example/image/upload/v1111737494/expense/operative_expense/venue_rental/x6224doorez3s5vwlvpkh.png`,
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
  @IsEnum(RecordStatus, {
    message:
      'El estado de registro debe ser uno de los siguientes valores: Activo o Inactivo',
  })
  @IsOptional()
  recordStatus?: string;

  //* Relations
  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsOptional()
  churchId?: string;
}
