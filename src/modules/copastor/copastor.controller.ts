import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { UserRoles } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';

import { User } from '@/modules/user/entities';

import { Copastor } from '@/modules/copastor/entities';
import { CopastorService } from '@/modules/copastor/copastor.service';
import { CreateCopastorDto, UpdateCopastorDto } from '@/modules/copastor/dto';

@ApiTags('Copastors')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized Bearer Auth.',
})
@ApiInternalServerErrorResponse({
  description: 'Internal server error, check logs',
})
@ApiBadRequestResponse({
  description: 'Bad request.',
})
@Controller('copastors')
export class CopastorController {
  constructor(private readonly copastorService: CopastorService) {}

  //* CREATE
  @Post()
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  @ApiCreatedResponse({
    description: 'Copastor has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  create(
    @Body() createCopastorDto: CreateCopastorDto,
    @GetUser() user: User,
  ): Promise<Copastor> {
    return this.copastorService.create(createCopastorDto, user);
  }

  @Get()
  findAll() {
    return this.copastorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.copastorService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCopastorDto: UpdateCopastorDto,
  ) {
    return this.copastorService.update(+id, updateCopastorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.copastorService.remove(+id);
  }
}
