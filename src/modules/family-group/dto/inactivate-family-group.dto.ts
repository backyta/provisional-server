import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import {
  FamilyGroupInactivationReason,
  FamilyGroupInactivationCategory,
} from '@/modules/family-group/enums';

export class InactivateFamilyGroupDto {
  @ApiProperty({
    example: FamilyGroupInactivationCategory.HostUnavailability,
    description: 'Member inactivation category.',
  })
  @IsNotEmpty()
  @IsEnum(FamilyGroupInactivationCategory)
  familyGroupInactivationCategory: string;

  @ApiProperty({
    example: FamilyGroupInactivationReason.HostFamilyDecision,
    description: 'Reason for member removal.',
  })
  @IsNotEmpty()
  @IsEnum(FamilyGroupInactivationReason)
  familyGroupInactivationReason: string;
}
