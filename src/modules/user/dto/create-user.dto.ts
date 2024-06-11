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

import { Status } from '@/common/enums';
import { UserRoles } from '@/modules/auth/enums';

export class CreateUserDto {
  @ApiProperty({
    example: 'example@example.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  // TODO : validar el regex del front con el del back
  @ApiProperty({
    example: 'Abcd12345',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'The password must have a Uppercase, lowercase letter and a number',
  })
  password: string;

  @ApiProperty({
    example: 'John Martin',
  })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({
    example: 'Rojas Sanchez',
  })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({
    example: Status.Active,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @IsEnum(UserRoles, { each: true })
  @IsArray()
  @IsNotEmpty()
  roles: string[];
}
