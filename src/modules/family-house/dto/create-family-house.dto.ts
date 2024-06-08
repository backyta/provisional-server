import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@/common/enums';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFamilyHouseDto {
  //General info
  @ApiProperty({
    example: 'Guerreros de Jehova',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(30)
  houseName: string;

  @ApiProperty({
    example: '17:30',
  })
  @IsString()
  @IsNotEmpty()
  worshipTime: string;

  // Contact Info
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
    example: 'La Merced',
  })
  @IsString()
  @IsNotEmpty()
  urbanSector: string;

  @ApiProperty({
    example: 'Jr. Central 123',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    example: 'Cerca del parque central',
  })
  @IsString()
  @IsNotEmpty()
  referenceAddress: string;

  @ApiProperty({
    example: 'active',
  })
  @IsString()
  @IsEnum(Status)
  @IsOptional()
  status?: string;

  // Relations
  @ApiProperty({
    example: '38137648-cf88-4010-a0fd-10e3648440d3',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsUUID()
  theirPreacher?: string;

  @ApiProperty({
    example: '38137648-cf88-4010-a0fd-10e3648440d3',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsUUID()
  theirZone?: string;
}
