import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OfferingReasonEliminationType } from '@/modules/offering/shared/enums';

export class DeleteOfferingDto {
  @ApiProperty({
    example: OfferingReasonEliminationType.FamilyGroupSelectionError,
  })
  @IsNotEmpty()
  @IsEnum(OfferingReasonEliminationType)
  reasonEliminationType: string;

  @ApiProperty({
    example: '3.89',
  })
  @IsString()
  @IsOptional()
  exchangeRate?: string;

  @ApiProperty({
    example: 'pen_to_usd',
  })
  @IsString()
  @IsOptional()
  exchangeCurrencyType?: string;
}

//TODO : poner description para la doc
