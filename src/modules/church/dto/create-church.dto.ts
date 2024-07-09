import { Status } from '@/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChurchDto {
  //* General and Personal info
  @ApiProperty({
    example: 'Iglesia Cristiana Fortaleza - Agua Viva',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  churchName: string;

  @ApiProperty({
    example: 'true',
  })
  @IsBoolean()
  @IsOptional()
  isAnexe?: boolean;

  @ApiProperty({
    example: ['9:00', '16:00'],
  })
  @IsArray()
  @IsNotEmpty()
  worshipTimes: string[];

  @ApiProperty({
    example: '2020/10/25',
  })
  @IsString()
  @IsNotEmpty()
  foundingDate: string | Date;

  //* Contact Info
  @ApiProperty({
    example: 'iglesia@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '99998888',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    example: 'Peru',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(15)
  country?: string;

  @ApiProperty({
    example: 'Lima',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(15)
  department?: string;

  @ApiProperty({
    example: 'Lima',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(15)
  province?: string;

  @ApiProperty({
    example: 'Comas',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  district: string;

  @ApiProperty({
    example: 'La Merced',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(30)
  urbanSector: string;

  @ApiProperty({
    example: 'Av.Progreso 123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  address: string;

  @ApiProperty({
    example: 'A una cuadra del hospital central',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  referenceAddress: string;

  //* Roles and Status
  @ApiProperty({
    example: 'active',
  })
  @IsString()
  @IsEnum(Status)
  @IsOptional()
  status?: string;

  //* Relations
  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirMainChurch?: string;
}
