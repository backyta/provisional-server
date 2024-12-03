import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { MemberInactivationCategory, MemberInactivationReason } from '../enums';

export class MemberInactivateDto {
  @ApiProperty({
    example: MemberInactivationCategory.PersonalChallenges,
    description: 'Member inactivation category.',
  })
  @IsNotEmpty()
  @IsEnum(MemberInactivationCategory)
  inactivationCategory: string;

  @ApiProperty({
    example: MemberInactivationReason.HealthIssues,
    description: 'Reason for member removal.',
  })
  @IsNotEmpty()
  @IsEnum(MemberInactivationReason)
  inactivationReason: string;
}
