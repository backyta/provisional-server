import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

import { UserRole } from '@/modules/auth/enums';
import { Auth, GetUser } from '@/modules/auth/decorators';

import { User } from '@/modules/user/entities';

import {
  CreateOfferingIncomeDto,
  UpdateOfferingIncomeDto,
} from '@/modules/offering/income/dto';
import { OfferingIncome } from '@/modules/offering/income/entities';
import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';

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

  @Get()
  findAll() {
    return this.offeringIncomeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offeringIncomeService.findOne(+id);
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
