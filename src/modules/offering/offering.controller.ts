import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { OfferingService } from '@/modules/offering/offering.service';
import { CreateOfferingDto, UpdateOfferingDto } from '@/modules/offering/dto';

@Controller('offering')
export class OfferingController {
  constructor(private readonly offeringService: OfferingService) {}

  @Post()
  create(@Body() createOfferingDto: CreateOfferingDto) {
    return this.offeringService.create(createOfferingDto);
  }

  @Get()
  findAll() {
    return this.offeringService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offeringService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOfferingDto: UpdateOfferingDto,
  ) {
    return this.offeringService.update(+id, updateOfferingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offeringService.remove(+id);
  }
}
