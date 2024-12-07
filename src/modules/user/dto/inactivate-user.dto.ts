import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import {
  UserInactivationReason,
  UserInactivationCategory,
} from '@/modules/user/enums';

export class InactivateUserDto {
  @ApiProperty({
    example: UserInactivationCategory.PerformanceOrConduct,
    description: 'Member inactivation category.',
  })
  @IsNotEmpty()
  @IsEnum(UserInactivationCategory)
  userInactivationCategory: string;

  @ApiProperty({
    example: UserInactivationReason.OrganizationalRestructure,
    description: 'Reason for member removal.',
  })
  @IsNotEmpty()
  @IsEnum(UserInactivationReason)
  userInactivationReason: string;
}
