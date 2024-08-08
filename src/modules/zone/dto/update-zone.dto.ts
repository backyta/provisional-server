import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateZoneDto } from '@/modules/zone/dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateZoneDto extends PartialType(CreateZoneDto) {
  @ApiProperty({
    example: 'Abcd12345',
  })
  @IsOptional()
  @IsString()
  newTheirSupervisor?: string;
}
