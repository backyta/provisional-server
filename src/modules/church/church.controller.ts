import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
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
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';

import { Auth, GetUser } from '@/modules/auth/decorators';
import { UserRoles } from '@/modules/auth/enums';

import { User } from '@/modules/user/entities';

import { Church } from '@/modules/church/entities';
import { ChurchService } from '@/modules/church/church.service';
import { CreateChurchDto, UpdateChurchDto } from '@/modules/church/dto';
import { PaginationDto } from '@/common/dtos';

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

  //* Find All
  @Get()
  @Auth()
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiNotFoundResponse({
    description: 'Not found resource.',
  })
  findAll(@Query() paginationDto: PaginationDto): Promise<Church[]> {
    return this.churchService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.churchService.findOne(+id);
  }

  //* Update
  @Patch(':id')
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  @ApiOkResponse({
    description: 'Successful operation',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChurchDto: UpdateChurchDto,
    @GetUser() user: User,
  ): Promise<Church> {
    return this.churchService.update(id, updateChurchDto, user);
  }

  //* Delete
  @Delete(':id')
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.churchService.remove(id, user);
  }
}
