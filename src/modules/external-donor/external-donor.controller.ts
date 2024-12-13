import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { PaginationDto } from '@/common/dtos';
import { Auth } from '@/modules/auth/decorators';

import {
  CreateExternalDonorDto,
  UpdateExternalDonorDto,
} from '@/modules/external-donor/dto';
import { ExternalDonor } from '@/modules/external-donor/entities';
import { ExternalDonorService } from '@/modules/external-donor/external-donor.service';

@ApiTags('Donadores-Externos')
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
@SkipThrottle()
@Controller('external-donor')
export class ExternalDonorController {
  constructor(private readonly externalDonorService: ExternalDonorService) {}

  @Post()
  create(@Body() createExternalDonatorDto: CreateExternalDonorDto) {
    return this.externalDonorService.create(createExternalDonatorDto);
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
  findAll(@Query() paginationDto: PaginationDto): Promise<ExternalDonor[]> {
    return this.externalDonorService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.externalDonorService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExternalDonatorDto: UpdateExternalDonorDto,
  ) {
    return this.externalDonorService.update(+id, updateExternalDonatorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.externalDonorService.remove(+id);
  }
}
