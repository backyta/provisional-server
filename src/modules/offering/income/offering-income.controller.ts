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
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

import { UserRole } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';

import { User } from '@/modules/user/entities';
import { DeleteOfferingDto } from '@/modules/offering/shared/dto';

import {
  CreateOfferingIncomeDto,
  UpdateOfferingIncomeDto,
} from '@/modules/offering/income/dto';
import { OfferingIncome } from '@/modules/offering/income/entities';
import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';

@Controller('offerings-income')
export class OfferingIncomeController {
  constructor(private readonly offeringIncomeService: OfferingIncomeService) {}

  //* CREATE
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

  //* FIND ALL
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

  //* FIND BY TERM
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
    @Body() updateOfferingIncomeDto: UpdateOfferingIncomeDto,
    @GetUser() user: User,
  ): Promise<OfferingIncome> {
    return this.offeringIncomeService.update(id, updateOfferingIncomeDto, user);
  }

  //! DELETE
  @Delete(':id')
  @ApiOkResponse({
    description: 'Successful operation.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  remove(
    @Param('id') id: string,
    @Query() deleteOfferingIncomeDto: DeleteOfferingDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.offeringIncomeService.remove(id, deleteOfferingIncomeDto, user);
  }
}
