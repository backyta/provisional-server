import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { MaritalStatus, MemberRoles, Gender, Status } from '@/common/enums';

export class CreatePastorDto {
  //* General and Personal info
  @ApiProperty({
    example: 'John Martin',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  firstName: string;

  @ApiProperty({
    example: 'Rojas Castro',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  lastName: string;

  @ApiProperty({
    example: 'male',
  })
  @IsEnum(Gender)
  gender: string;

  @ApiProperty({
    example: 'single',
  })
  @IsEnum(MaritalStatus, {
    message:
      'El estado civil debe ser uno de los siguientes valores: Soltero(a), Casado(a), Divorciado(a), Viudo(a), Otro.',
  })
  @IsNotEmpty()
  maritalStatus: string;

  @ApiProperty({
    example: 'Colombia',
  })
  @IsString()
  @IsNotEmpty()
  originCountry: string;

  @ApiProperty({
    example: '1990/12/23',
  })
  @IsString()
  @IsNotEmpty()
  birthDate: string | Date;

  @ApiProperty({
    example: '2',
  })
  @IsOptional()
  numberChildren?: string | number;

  @ApiProperty({
    example: '2001/12/23',
  })
  @IsString()
  @IsOptional()
  conversionDate?: string | Date;

  //* Contact Info
  @ApiProperty({
    example: 'example@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '999333555',
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
    example: 'Las Lomas',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(30)
  urbanSector: string;

  @ApiProperty({
    example: 'Av. Central 123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  address: string;

  @ApiProperty({
    example: 'A 2 cuadras al colegio',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  referenceAddress: string;

  //* Roles and Status
  @ApiProperty({
    example: ['disciple', 'pastor'],
  })
  @IsEnum(MemberRoles, { each: true })
  @IsArray()
  @IsNotEmpty()
  roles: string[];

  @ApiProperty({
    example: 'active',
  })
  @IsString()
  @IsEnum(Status)
  @IsOptional()
  status?: string;

  //Relations
  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirChurch?: string;
}
