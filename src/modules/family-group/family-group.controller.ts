import {
  Get,
  Post,
  Body,
  Query,
  Patch,
  Param,
  Delete,
  Controller,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  ApiTags,
  ApiParam,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

import { User } from '@/modules/user/entities';

import { UserRole } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';

import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
} from '@/modules/family-group/dto';
import { FamilyGroup } from '@/modules/family-group/entities';
import { FamilyGroupService } from '@/modules/family-group/family-group.service';

@ApiTags('Family-Groups')
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
@Controller('family-groups')
export class FamilyGroupController {
  constructor(private readonly familyGroupService: FamilyGroupService) {}

  //* CREATE
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @ApiCreatedResponse({
    description: 'Family House has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  create(
    @Body() createFamilyGroupDto: CreateFamilyGroupDto,
    @GetUser() user: User,
  ): Promise<FamilyGroup> {
    return this.familyGroupService.create(createFamilyGroupDto, user);
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
  findAll(@Query() paginationDto: PaginationDto): Promise<FamilyGroup[]> {
    return this.familyGroupService.findAll(paginationDto);
  }

  //* FIND BY TERM
  @Get(':term')
  @Auth()
  @ApiParam({
    name: 'term',
    description: 'Could be names, zones, districts, address, etc.',
  })
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiNotFoundResponse({
    description: 'Not found resource.',
  })
  findByTerm(
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<FamilyGroup | FamilyGroup[]> {
    return this.familyGroupService.findByTerm(term, searchTypeAndPaginationDto);
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
    @Body() updateFamilyGroupDto: UpdateFamilyGroupDto,
    @GetUser() user: User,
  ): Promise<FamilyGroup> {
    return this.familyGroupService.update(id, updateFamilyGroupDto, user);
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
    return this.familyGroupService.remove(id, user);
  }
}
