import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

import { SearchType, SearchSubType } from '@/common/enums';

export class SearchAndPaginationDto {
  @ApiProperty({
    enum: SearchType,
    description:
      'Choose one of types, to search for types (different entities).',
  })
  @IsEnum(SearchType)
  @IsNotEmpty({ message: 'El tipo de búsqueda es requerido.' })
  @IsString()
  'search-type': string;

  @ApiProperty({
    enum: SearchSubType,
    description: 'Choose one sub type.',
  })
  @IsEnum(SearchSubType)
  @IsOptional()
  @IsString()
  'search-sub-type'?: string;

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
    description: 'What type of order do you need the records in?',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  order?: string;

  //* For preacher module when search by zone id and return preacher with family groups or not
  @ApiProperty({
    default: 'ASC',
    description: 'Do you want null relationships to be returned?',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  isNull?: string;
}
