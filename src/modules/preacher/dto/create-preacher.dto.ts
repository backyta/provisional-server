import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsArray,
  IsEmail,
  IsString,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';
import {
  Gender,
  MemberRole,
  RecordStatus,
  MaritalStatus,
  MemberInactivationReason,
  MemberInactivationCategory,
} from '@/common/enums';

export class CreatePreacherDto {
  //* General and Personal info
  @ApiProperty({
    example: 'Felix Alberto',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  firstName: string;

  @ApiProperty({
    example: 'Garcia Perez',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  lastName: string;

  @ApiProperty({
    example: Gender.Male,
  })
  @IsEnum(Gender, {
    message:
      'El género debe ser uno de los siguientes valores: Masculino o Femenino',
  })
  gender: string;

  @ApiProperty({
    example: MaritalStatus.Widowed,
  })
  @IsEnum(MaritalStatus, {
    message:
      'El estado civil debe ser uno de los siguientes valores: Soltero(a), Casado(a), Divorciado(a), Viudo(a), Otro.',
  })
  @IsNotEmpty()
  maritalStatus: string;

  @ApiProperty({
    example: 'Chile',
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
  @MaxLength(80)
  address: string;

  @ApiProperty({
    example: 'A 1 cuadra del colegio',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(150)
  referenceAddress: string;

  //* Roles and Status
  @ApiProperty({
    example: [MemberRole.Preacher],
  })
  @IsEnum(MemberRole, {
    each: true,
    message:
      'El valor debe ser un rol válido. Solo se permite el rol "Predicador"',
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

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isDirectRelationToPastor?: boolean;

  //* Relations
  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirPastor?: string;

  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirCopastor?: string;

  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirSupervisor?: string;

  //? Inactivation Data (optional)
  @ApiProperty({
    example: MemberInactivationCategory.PersonalChallenges,
    description: 'Member inactivation category.',
  })
  @IsOptional()
  @IsEnum(MemberInactivationCategory)
  inactivationCategory?: string;

  @ApiProperty({
    example: MemberInactivationReason.HealthIssues,
    description: 'Reason for member removal.',
  })
  @IsOptional()
  @IsEnum(MemberInactivationReason)
  inactivationReason?: string;
}
