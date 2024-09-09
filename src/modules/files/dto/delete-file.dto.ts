import { OfferingFileType } from '@/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DeleteFileDto {
  @ApiProperty({
    example: 'my-folder/my-sub-folder/',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  path: string;

  @ApiProperty({
    example:
      'https://res.cloudinary.com/example/image/upload/v1239394512/cld-sample-4.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  secureUrl: string;

  @ApiProperty({
    example: OfferingFileType.Expense,
  })
  @IsEnum(OfferingFileType)
  @IsNotEmpty()
  @MinLength(1)
  fileType: string;
}
