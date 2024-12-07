import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import {
  ZoneInactivationReason,
  ZoneInactivationCategory,
} from '@/modules/zone/enums';

export class InactivateZoneDto {
  @ApiProperty({
    example: ZoneInactivationCategory.GroupFamilyRelatedReasons,
    description: 'Member inactivation category.',
  })
  @IsNotEmpty()
  @IsEnum(ZoneInactivationCategory)
  zoneInactivationCategory: string;

  @ApiProperty({
    example: ZoneInactivationReason.FamilyGroupRelocation,
    description: 'Reason for member removal.',
  })
  @IsNotEmpty()
  @IsEnum(ZoneInactivationReason)
  zoneInactivationReason: string;
}
