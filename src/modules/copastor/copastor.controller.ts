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

import { UserRoles } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';

import { User } from '@/modules/user/entities';

import { Copastor } from '@/modules/copastor/entities';
import { CopastorService } from '@/modules/copastor/copastor.service';
import { CreateCopastorDto, UpdateCopastorDto } from '@/modules/copastor/dto';
import { Pastor } from '@/modules/pastor/entities';
import { PaginationDto } from '@/common/dtos';

@ApiTags('Copastors')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized Bearer Auth.',
})
@ApiInternalServerErrorResponse({
  description: 'Internal server error, check logs',
})
@ApiBadRequestResponse({
  description: 'Bad request.',
})
@Controller('copastors')
export class CopastorController {
  constructor(private readonly copastorService: CopastorService) {}

  //* CREATE
  @Post()
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  @ApiCreatedResponse({
    description: 'Copastor has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  create(
    @Body() createCopastorDto: CreateCopastorDto,
    @GetUser() user: User,
  ): Promise<Copastor> {
    return this.copastorService.create(createCopastorDto, user);
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
  findAll(@Query() paginationDto: PaginationDto): Promise<Copastor[]> {
    return this.copastorService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.copastorService.findOne(+id);
  }

  //* UPDATE
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
    @Body() updateCopastorDto: UpdateCopastorDto,
    @GetUser() user: User,
  ): Promise<Copastor | Pastor> {
    return this.copastorService.update(id, updateCopastorDto, user);
  }

  //! DELETE
  @Delete(':id')
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.copastorService.remove(id, user);
  }
}
