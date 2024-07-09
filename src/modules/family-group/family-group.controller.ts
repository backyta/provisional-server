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

import { User } from '@/modules/user/entities';

import { UserRoles } from '@/modules/auth/enums';
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

  //* Create
  @Post()
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
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

  //* Find All
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.familyGroupService.findOne(+id);
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
    @Body() updateFamilyGroupDto: UpdateFamilyGroupDto,
    @GetUser() user: User,
  ): Promise<FamilyGroup> {
    return this.familyGroupService.update(id, updateFamilyGroupDto, user);
  }

  //* Delete
  @Delete(':id')
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.familyGroupService.remove(id, user);
  }
}