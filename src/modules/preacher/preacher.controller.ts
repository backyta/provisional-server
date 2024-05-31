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

import { PreacherService } from '@/modules/preacher/preacher.service';
import { CreatePreacherDto, UpdatePreacherDto } from '@/modules/preacher/dto';
import { UserRoles } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';
import { Preacher } from '@/modules/preacher/entities';
import { User } from '@/modules/user/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { PaginationDto } from '@/common/dtos';

@ApiTags('Preachers')
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
@Controller('preachers')
export class PreacherController {
  constructor(private readonly preacherService: PreacherService) {}

  //* Create
  @Post()
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  @ApiCreatedResponse({
    description: 'Preacher has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  create(
    @Body() createPreacherDto: CreatePreacherDto,
    @GetUser() user: User,
  ): Promise<Preacher> {
    return this.preacherService.create(createPreacherDto, user);
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
  findAll(@Query() paginationDto: PaginationDto): Promise<Preacher[]> {
    return this.preacherService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.preacherService.findOne(+id);
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
    @Body() updatePreacherDto: UpdatePreacherDto,
    @GetUser() user: User,
  ): Promise<Preacher | Supervisor> {
    return this.preacherService.update(id, updatePreacherDto, user);
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
    return this.preacherService.remove(id, user);
  }
}
