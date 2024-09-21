import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Min } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({
    default: 10,
    description: 'How many rows do you need?',
  })
  @IsOptional()
  @Type(() => Number) // No use GlobalPipes with properties transform (enableImplicitConventions)
  limit?: number;

  @ApiProperty({
    default: 0,
    description: 'How many rows do you want to skip?',
  })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;

  @ApiProperty({
    default: 'ASC',
    description: 'En que tipo de orden necesitas los registros?',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  order?: string;

  //* For zone module when search supervisors and return supervisors with zone or not
  @ApiProperty({
    default: 'ASC',
    description: 'Do you want null relationships to be returned?',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isNull?: boolean;
}
