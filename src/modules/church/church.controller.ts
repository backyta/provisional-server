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

import { Auth, GetUser } from '@/modules/auth/decorators';
import { UserRoles } from '@/modules/auth/enums';

import { User } from '@/modules/user/entities';

import { Church } from '@/modules/church/entities';
import { ChurchService } from '@/modules/church/church.service';
import { CreateChurchDto, UpdateChurchDto } from '@/modules/church/dto';

@ApiTags('Churches')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized Bearer Auth.',
})
@ApiInternalServerErrorResponse({
  description: 'Internal server error, check logs.',
})
@ApiBadRequestResponse({
  description: 'Bad request.',
})
@Controller('churches')
export class ChurchController {
  constructor(private readonly churchService: ChurchService) {}

  //* Create
  @Post()
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  @ApiCreatedResponse({
    description: 'Church has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  create(
    @Body() createChurchDto: CreateChurchDto,
    @GetUser() user: User,
  ): Promise<Church> {
    return this.churchService.create(createChurchDto, user);
  }

  @Get()
  findAll() {
    return this.churchService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.churchService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChurchDto: UpdateChurchDto) {
    return this.churchService.update(+id, updateChurchDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.churchService.remove(+id);
  }
}
