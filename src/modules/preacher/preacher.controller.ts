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

import { PreacherService } from '@/modules/preacher/preacher.service';
import { CreatePreacherDto, UpdatePreacherDto } from '@/modules/preacher/dto';
import { UserRoles } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';
import { Preacher } from '@/modules/preacher/entities';
import { User } from '@/modules/user/entities';

@ApiTags('Preachers')
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
@Controller('preachers')
export class PreacherController {
  constructor(private readonly preacherService: PreacherService) {}

  //* Create
  @Post()
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  @ApiCreatedResponse({
    description: 'Preacher has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  create(
    @Body() createPreacherDto: CreatePreacherDto,
    @GetUser() user: User,
  ): Promise<Preacher> {
    return this.preacherService.create(createPreacherDto, user);
  }

  @Get()
  findAll() {
    return this.preacherService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.preacherService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePreacherDto: UpdatePreacherDto,
  ) {
    return this.preacherService.update(+id, updatePreacherDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.preacherService.remove(+id);
  }
}
