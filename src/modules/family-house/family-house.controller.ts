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
  CreateFamilyHouseDto,
  UpdateFamilyHouseDto,
} from '@/modules/family-house/dto';
import { FamilyHouse } from '@/modules/family-house/entities';
import { FamilyHouseService } from '@/modules/family-house/family-house.service';

@ApiTags('Family-Houses')
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
@Controller('family-houses')
export class FamilyHouseController {
  constructor(private readonly familyHouseService: FamilyHouseService) {}

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
    @Body() createFamilyHouseDto: CreateFamilyHouseDto,
    @GetUser() user: User,
  ): Promise<FamilyHouse> {
    return this.familyHouseService.create(createFamilyHouseDto, user);
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
  findAll(@Query() paginationDto: PaginationDto): Promise<FamilyHouse[]> {
    return this.familyHouseService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.familyHouseService.findOne(+id);
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
    @Body() updateFamilyHomeDto: UpdateFamilyHouseDto,
    @GetUser() user: User,
  ): Promise<FamilyHouse> {
    return this.familyHouseService.update(id, updateFamilyHomeDto, user);
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
    return this.familyHouseService.remove(id, user);
  }
}
