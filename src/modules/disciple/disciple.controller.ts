import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { DiscipleService } from '@/modules/disciple/disciple.service';
import { CreateDiscipleDto, UpdateDiscipleDto } from '@/modules/disciple/dto';
import { Auth, GetUser } from '@/modules/auth/decorators';
import { UserRoles } from '@/modules/auth/enums';
import { Disciple } from '@/modules/disciple/entities';
import { User } from '@/modules/user/entities';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Disciples')
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
@Controller('disciples')
export class DiscipleController {
  constructor(private readonly discipleService: DiscipleService) {}

  //* Create
  @Post()
  @Auth(UserRoles.SuperUser, UserRoles.AdminUser)
  @ApiCreatedResponse({
    description: 'Zone has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  create(
    @Body() createDiscipleDto: CreateDiscipleDto,
    @GetUser() user: User,
  ): Promise<Disciple> {
    return this.discipleService.create(createDiscipleDto, user);
  }

  @Get()
  findAll() {
    return this.discipleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.discipleService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDiscipleDto: UpdateDiscipleDto,
  ) {
    return this.discipleService.update(+id, updateDiscipleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.discipleService.remove(+id);
  }
}
