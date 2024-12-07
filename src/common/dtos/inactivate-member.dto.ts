import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import {
  MemberInactivationReason,
  MemberInactivationCategory,
} from '@/common/enums';

export class InactivateMemberDto {
  @ApiProperty({
    example: MemberInactivationCategory.PersonalChallenges,
    description: 'Member inactivation category.',
  })
  @IsNotEmpty()
  @IsEnum(MemberInactivationCategory)
  memberInactivationCategory: string;

  @ApiProperty({
    example: MemberInactivationReason.HealthIssues,
    description: 'Reason for member removal.',
  })
  @IsNotEmpty()
  @IsEnum(MemberInactivationReason)
  memberInactivationReason: string;
}
