import { PartialType } from '@nestjs/swagger';
import { CreateChurchDto } from '@/modules/church/dto';

export class UpdateChurchDto extends PartialType(CreateChurchDto) {}
