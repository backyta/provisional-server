import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

import { CreateFamilyGroupDto } from '@/modules/family-group/dto';

export class UpdateFamilyGroupDto extends PartialType(CreateFamilyGroupDto) {
  @ApiProperty({
    example: 'Abcd12345',
  })
  @IsOptional()
  @IsString()
  newTheirPreacher?: string;
}
