import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserRole } from '@/modules/auth/enums';
import { Gender, RecordStatus } from '@/common/enums';

export class CreateUserDto {
  @ApiProperty({
    example: 'jorge.villena@icup.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Abcd$12345$',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'The password must have a Uppercase, lowercase letter and a number',
  })
  password: string;

  @ApiProperty({
    example: 'Jorge Martin',
  })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({
    example: 'Villena Sanchez',
  })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({
    example: Gender.Female,
  })
  @IsEnum(Gender, {
    message:
      'El género debe ser uno de los siguientes valores: Masculino o Femenino',
  })
  gender: string;

  @ApiProperty({
    example: RecordStatus.Active,
  })
  @IsString()
  @IsOptional()
  recordStatus?: string;

  @ApiProperty({
    example: [UserRole.SuperUser, UserRole.TreasurerUser],
  })
  @IsEnum(UserRole, {
    each: true,
    message:
      'Los roles pueden contener los siguientes valores: Super-Usuario, Usuario-Admin., Usuario-Tesor., Usuario.',
  })
  @IsArray()
  @IsNotEmpty()
  roles: string[];
}
