import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { FamilyHouseService } from '@/modules/family-house/family-house.service';
import { Auth, GetUser } from '@/modules/auth/decorators';
import { UserRoles } from '@/modules/auth/enums';
import { User } from '@/modules/user/entities';
import { FamilyHouse } from '@/modules/family-house/entities';
import {
  CreateFamilyHouseDto,
  UpdateFamilyHouseDto,
} from '@/modules/family-house/dto';

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

  @Get()
  findAll() {
    return this.familyHouseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.familyHouseService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFamilyHouseDto: UpdateFamilyHouseDto,
  ) {
    return this.familyHouseService.update(+id, updateFamilyHouseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.familyHouseService.remove(+id);
  }
}
