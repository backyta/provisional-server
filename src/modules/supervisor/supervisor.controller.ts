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
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { PaginationDto, SearchByTypeAndPaginationDto } from '@/common/dtos';

import { UserRole } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';

import { User } from '@/modules/user/entities';
import { Copastor } from '@/modules/copastor/entities';

import {
  CreateSupervisorDto,
  UpdateSupervisorDto,
} from '@/modules/supervisor/dto';
import { Supervisor } from '@/modules/supervisor/entities';
import { SupervisorService } from '@/modules/supervisor/supervisor.service';

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
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @ApiCreatedResponse({
    description: 'Supervisor has been successfully created.',
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

  //* Find By Term
  @Get(':term')
  @Auth()
  @ApiParam({
    name: 'term',
    description: 'Could be names, dates, districts, address, etc.',
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiNotFoundResponse({
    description: 'Not found resource.',
  })
  findTerm(
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchByTypeAndPaginationDto,
  ): Promise<Supervisor | Supervisor[]> {
    return this.supervisorService.findByTerm(term, searchTypeAndPaginationDto);
  }

  //* Update
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
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
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
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
