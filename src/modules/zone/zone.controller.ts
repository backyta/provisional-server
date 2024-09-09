import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  Controller,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiOkResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

import { UserRole } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';

import { User } from '@/modules/user/entities';

import { Zone } from '@/modules/zone/entities';
import { ZoneService } from '@/modules/zone/zone.service';
import { CreateZoneDto, UpdateZoneDto } from '@/modules/zone/dto';

@ApiTags('Zones')
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
@Controller('zones')
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  //* CREATE
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @ApiCreatedResponse({
    description: 'Zone has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  create(
    @Body() createZoneDto: CreateZoneDto,
    @GetUser() user: User,
  ): Promise<Zone> {
    return this.zoneService.create(createZoneDto, user);
  }

  //* FIND ALL
  @Get()
  @Auth()
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiNotFoundResponse({
    description: 'Not found resource.',
  })
  findAll(@Query() paginationDto: PaginationDto): Promise<Zone[]> {
    return this.zoneService.findAll(paginationDto);
  }

  //* FIND BY TERM
  @Get(':term')
  @Auth()
  @ApiParam({
    name: 'term',
    description: 'Could be name church, dates, department, address, etc.',
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
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<Zone | Zone[]> {
    return this.zoneService.findByTerm(term, searchTypeAndPaginationDto);
  }

  //* UPDATE
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
    @Body() updateZoneDto: UpdateZoneDto,
    @GetUser() user: User,
  ): Promise<Zone> {
    return this.zoneService.update(id, updateZoneDto, user);
  }

  //! DELETE
  @Delete(':id')
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.zoneService.remove(id, user);
  }
}
