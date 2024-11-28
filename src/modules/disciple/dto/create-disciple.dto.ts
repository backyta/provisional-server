import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import {
  Gender,
  MemberRole,
  RecordStatus,
  MaritalStatus,
} from '@/common/enums';

export class CreateDiscipleDto {
  //* General and Personal info
  @ApiProperty({
    example: 'Maria Luisa',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  firstName: string;

  @ApiProperty({
    example: 'Paredes Villa',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  lastName: string;

  @ApiProperty({
    example: Gender.Female,
  })
  @IsEnum(Gender, {
    message:
      'El genero debe ser uno de los siguientes valores: Masculino o Femenino',
  })
  gender: string;

  @ApiProperty({
    example: MaritalStatus.Married,
  })
  @IsEnum(MaritalStatus, {
    message:
      'El estado civil debe ser uno de los siguientes valores: Soltero(a), Casado(a), Divorciado(a), Viudo(a), Otro.',
  })
  @IsNotEmpty()
  maritalStatus: string;

  @ApiProperty({
    example: 'Ecuador',
  })
  @IsString()
  @IsNotEmpty()
  originCountry: string;

  @ApiProperty({
    example: '1990/12/23',
  })
  @IsString()
  @IsNotEmpty()
  birthDate: Date;

  @ApiProperty({
    example: '2',
  })
  @IsOptional()
  numberChildren?: number | string;

  @ApiProperty({
    example: '2001/12/23',
  })
  @IsString()
  @IsOptional()
  conversionDate?: Date;

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
    example: 'La Merced',
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
  @MaxLength(80)
  address: string;

  @ApiProperty({
    example: 'A una cuadra del hospital central',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(150)
  referenceAddress: string;

  //* Roles and Status
  @ApiProperty({
    example: [MemberRole.Disciple],
  })
  @IsEnum(MemberRole, {
    each: true,
    message:
      'El valor debe ser un rol válido. Solo se permite el rol "Discípulo"',
  })
  @IsArray()
  @IsNotEmpty()
  roles: string[];

  @ApiProperty({
    example: RecordStatus.Active,
  })
  @IsString()
  @IsEnum(RecordStatus, {
    message:
      'El estado de registro debe ser uno de los siguientes valores: Activo o Inactivo',
  })
  @IsOptional()
  recordStatus?: string;

  //* Relations
  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirFamilyGroup?: string;

  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirSupervisor?: string;
}
