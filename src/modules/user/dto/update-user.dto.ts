import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from '@/modules/user/dto';
import { IsOptional, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    example: 'Abcd12345',
  })
  @IsOptional()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'The current password must have a Uppercase, lowercase letter and a number',
  })
  currentPassword?: string;

  @ApiProperty({
    example: 'Abcd12345',
  })
  @IsOptional()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'The new password must have a Uppercase, lowercase letter and a number',
  })
  newPassword?: string;
}
