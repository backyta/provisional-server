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
import { UserService } from '@/modules/user/user.service';
import { CreateUserDto, UpdateUserDto } from '@/modules/user/dto';

@ApiTags('Users')
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
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  //* CREATE
  @ApiBearerAuth()
  @Post()
  @Auth(UserRole.SuperUser)
  @ApiCreatedResponse({
    description: 'User has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  registerUser(@Body() createUserDto: CreateUserDto, @GetUser() user: User) {
    return this.userService.create(createUserDto, user);
  }

  //* FIND ALL
  @Get()
  @Auth(UserRole.SuperUser)
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiNotFoundResponse({
    description: 'Not found resource.',
  })
  findAll(@Query() paginationDto: PaginationDto): Promise<User[]> {
    return this.userService.findAll(paginationDto);
  }

  //* FIND BY TERM
  @Get(':term')
  @Auth()
  @ApiParam({
    name: 'term',
    description: 'Could be names, last names, roles, gender, etc.',
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
  ): Promise<User | User[]> {
    return this.userService.findByTerm(term, searchTypeAndPaginationDto);
  }

  //* UPDATE
  @Patch(':id')
  @Auth(UserRole.SuperUser)
  @ApiOkResponse({
    description: 'Successful operation',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto, user);
  }

  //! DELETE
  @Delete(':id')
  @Auth(UserRole.SuperUser)
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
    return this.userService.delete(id, user);
  }
}
