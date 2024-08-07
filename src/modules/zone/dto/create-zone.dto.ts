import { RecordStatus } from '@/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateZoneDto {
  //* General info
  @ApiProperty({
    example: 'Zona-A',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(30)
  @IsOptional()
  zoneName?: string;

  @ApiProperty({
    example: 'Peru',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  country?: string;

  @ApiProperty({
    example: 'Lima',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  department?: string;

  @ApiProperty({
    example: 'Lima',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  province?: string;

  @ApiProperty({
    example: 'Comas',
  })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({
    example: 'active',
  })
  @IsString()
  @IsEnum(RecordStatus)
  @IsOptional()
  recordStatus?: string;

  //* Relations
  @ApiProperty({
    example: '38137648-cf88-4010-a0fd-10e3648440d3',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @IsUUID()
  theirSupervisor?: string;
}
