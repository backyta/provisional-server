import { Injectable } from '@nestjs/common';
import {
  CreateIncomeDto,
  UpdateIncomeDto,
} from '@/modules/offering/income/dto';

@Injectable()
export class IncomeService {
  create(createIncomeDto: CreateIncomeDto) {
    return 'This action adds a new income';
  }

  findAll() {
    return `This action returns all income`;
  }

  findOne(id: number) {
    return `This action returns a #${id} income`;
  }

  update(id: number, updateIncomeDto: UpdateIncomeDto) {
    return `This action updates a #${id} income`;
  }

  remove(id: number) {
    return `This action removes a #${id} income`;
  }
}
