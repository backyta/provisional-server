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

import { PaginationDto } from '@/common/dtos';

import { UserRoles } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';

import {
  CreateSupervisorDto,
  UpdateSupervisorDto,
} from '@/modules/supervisor/dto';
import { SupervisorService } from '@/modules/supervisor/supervisor.service';

import { User } from '@/modules/user/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';

@ApiTags('Supervisors')
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
@Controller('supervisors')
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

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
    @Body() createSupervisorDto: CreateSupervisorDto,
    @GetUser() user: User,
  ): Promise<Supervisor> {
    return this.supervisorService.create(createSupervisorDto, user);
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
  findAll(@Query() paginationDto: PaginationDto): Promise<Supervisor[]> {
    return this.supervisorService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supervisorService.findOne(+id);
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
    @Body() updateSupervisorDto: UpdateSupervisorDto,
    @GetUser() user: User,
  ): Promise<Supervisor | Copastor> {
    return this.supervisorService.update(id, updateSupervisorDto, user);
  }

  //! Delete
  @Delete(':id')
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.supervisorService.remove(id, user);
  }
}
