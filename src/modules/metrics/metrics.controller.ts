import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiOkResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import { SearchAndPaginationDto } from '@/common/dtos';

import { Auth } from '@/modules/auth/decorators';
import { MetricsService } from '@/modules/metrics/metrics.service';

@ApiTags('Métricas')
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
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  //? FIND BY TERM
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
  findByTerm(
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<any> {
    return this.metricsService.findByTerm(term, searchTypeAndPaginationDto);
  }
}
