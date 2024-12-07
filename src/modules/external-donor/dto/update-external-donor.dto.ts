import { PartialType } from '@nestjs/swagger';
import { CreateExternalDonorDto } from './create-external-donor.dto';

export class UpdateExternalDonorDto extends PartialType(
  CreateExternalDonorDto,
) {}
