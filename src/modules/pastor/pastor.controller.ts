import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Auth, GetUser } from '@/modules/auth/decorators';
import { UserRoles } from '@/modules/auth/enums';

import { User } from '@/modules/user/entities';

import { Pastor } from '@/modules/pastor/entities';
import { PastorService } from '@/modules/pastor/pastor.service';
import { CreatePastorDto, UpdatePastorDto } from '@/modules/pastor/dto';

@ApiTags('Pastors')
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
@Controller('pastors')
export class PastorController {
  constructor(private readonly pastorService: PastorService) {}

  //* Create
  @Post()
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  @ApiCreatedResponse({
    description: 'Pastor has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  create(
    @Body() createPastorDto: CreatePastorDto,
    @GetUser() user: User,
  ): Promise<Pastor> {
    return this.pastorService.create(createPastorDto, user);
  }

  @Get()
  findAll() {
    return this.pastorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pastorService.findOne(+id);
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
    @Body() updatePastorDto: UpdatePastorDto,
    @GetUser() user: User,
  ): Promise<Pastor> {
    return this.pastorService.update(id, updatePastorDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pastorService.remove(+id);
  }
}
