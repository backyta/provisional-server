import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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

import { UserRole } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';

import { User } from '@/modules/user/entities';
import { Pastor } from '@/modules/pastor/entities';

import { Copastor } from '@/modules/copastor/entities';
import { CopastorService } from '@/modules/copastor/copastor.service';
import { CreateCopastorDto, UpdateCopastorDto } from '@/modules/copastor/dto';

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
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
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
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<Copastor | Copastor[]> {
    return this.copastorService.findByTerm(term, searchTypeAndPaginationDto);
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
    @Body() updateCopastorDto: UpdateCopastorDto,
    @GetUser() user: User,
  ): Promise<Copastor | Pastor> {
    return this.copastorService.update(id, updateCopastorDto, user);
  }

  //! DELETE
  @Delete(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
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
