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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';

import { UserRole } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';

import { User } from '@/modules/user/entities';

import {
  CreateOfferingIncomeDto,
  UpdateOfferingIncomeDto,
} from '@/modules/offering/income/dto';
import { OfferingIncome } from '@/modules/offering/income/entities';
import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';
import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

@Controller('offerings-income')
export class OfferingIncomeController {
  constructor(private readonly offeringIncomeService: OfferingIncomeService) {}

  //* Create
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @ApiCreatedResponse({
    description: 'Disciple has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  create(
    @Body() createIncomeDto: CreateOfferingIncomeDto,
    @GetUser() user: User,
  ): Promise<OfferingIncome> {
    return this.offeringIncomeService.create(createIncomeDto, user);
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
  findAll(@Query() paginationDto: PaginationDto): Promise<OfferingIncome[]> {
    return this.offeringIncomeService.findAll(paginationDto);
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
  ): Promise<OfferingIncome | OfferingIncome[]> {
    return this.offeringIncomeService.findByTerm(
      term,
      searchTypeAndPaginationDto,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIncomeDto: UpdateOfferingIncomeDto,
  ) {
    return this.offeringIncomeService.update(+id, updateIncomeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offeringIncomeService.remove(+id);
  }
}
