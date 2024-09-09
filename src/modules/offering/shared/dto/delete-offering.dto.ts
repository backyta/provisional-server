import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OfferingReasonEliminationType } from '@/modules/offering/shared/enums';

export class DeleteOfferingDto {
  @ApiProperty({
    example: OfferingReasonEliminationType.FamilyGroupSelectionError,
  })
  @IsNotEmpty()
  @IsEnum(OfferingReasonEliminationType)
  @IsNotEmpty()
  reasonEliminationType: string;
}
