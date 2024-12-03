import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OfferingEliminationReasonType } from '@/modules/offering/shared/enums';

export class DeleteOfferingDto {
  @ApiProperty({
    example: OfferingEliminationReasonType.FamilyGroupSelectionError,
    description: 'Type of reason for record deletion.',
  })
  @IsNotEmpty()
  @IsEnum(OfferingEliminationReasonType)
  reasonEliminationType: string;

  @ApiProperty({
    example: '3.89',
    description: 'Type or amount of exchange.',
  })
  @IsString()
  @IsOptional()
  exchangeRate?: string;

  @ApiProperty({
    example: 'pen_to_usd',
    description: 'Currency for the exchange rate.',
  })
  @IsString()
  @IsOptional()
  exchangeCurrencyType?: string;
}
