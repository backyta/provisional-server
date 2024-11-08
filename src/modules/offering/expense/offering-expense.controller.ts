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

import {
  UpdateOfferingExpenseDto,
  CreateOfferingExpenseDto,
} from '@/modules/offering/expense/dto';

import { PaginationDto, SearchAndPaginationDto } from '@/common/dtos';

import { UserRole } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';

import { User } from '@/modules/user/entities';

import { DeleteOfferingDto } from '@/modules/offering/shared/dto';

import { OfferingExpense } from '@/modules/offering/expense/entities';
import { OfferingExpenseService } from '@/modules/offering/expense/offering-expense.service';

@Controller('offering-expenses')
export class OfferingExpenseController {
  constructor(
    private readonly offeringExpenseService: OfferingExpenseService,
  ) {}

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
    @Body() createIncomeDto: CreateOfferingExpenseDto,
    @GetUser() user: User,
  ): Promise<OfferingExpense> {
    return this.offeringExpenseService.create(createIncomeDto, user);
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
  findAll(@Query() paginationDto: PaginationDto): Promise<OfferingExpense[]> {
    return this.offeringExpenseService.findAll(paginationDto);
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
  findByTerm(
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<OfferingExpense[]> {
    return this.offeringExpenseService.findByTerm(
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
    @Body() updateExpenseDto: UpdateOfferingExpenseDto,
    @GetUser() user: User,
  ): Promise<OfferingExpense> {
    return this.offeringExpenseService.update(id, updateExpenseDto, user);
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
    return this.offeringExpenseService.remove(
      id,
      deleteOfferingIncomeDto,
      user,
    );
  }
}
