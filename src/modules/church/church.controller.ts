import {
  Query,
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

import { Church } from '@/modules/church/entities';
import { ChurchService } from '@/modules/church/church.service';
import { CreateChurchDto, UpdateChurchDto } from '@/modules/church/dto';

@ApiTags('Churches')
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
@Controller('churches')
export class ChurchController {
  constructor(private readonly churchService: ChurchService) {}

  //* CREATE
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @ApiCreatedResponse({
    description: 'Church has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  create(
    @Body() createChurchDto: CreateChurchDto,
    @GetUser() user: User,
  ): Promise<Church> {
    return this.churchService.create(createChurchDto, user);
  }

  //* FIN MAIN CHURCH
  @Get('main-church')
  @Auth()
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiNotFoundResponse({
    description: 'Not found resource.',
  })
  findMainChurch(@Query() paginationDto: PaginationDto): Promise<Church[]> {
    return this.churchService.findMainChurch(paginationDto);
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
  findAll(@Query() paginationDto: PaginationDto): Promise<Church[]> {
    return this.churchService.findAll(paginationDto);
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
  ): Promise<Church | Church[]> {
    return this.churchService.findByTerm(term, searchTypeAndPaginationDto);
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
    @Body() updateChurchDto: UpdateChurchDto,
    @GetUser() user: User,
  ): Promise<Church> {
    return this.churchService.update(id, updateChurchDto, user);
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
    return this.churchService.remove(id, user);
  }
}
