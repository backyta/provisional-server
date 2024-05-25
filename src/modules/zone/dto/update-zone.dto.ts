import { PartialType } from '@nestjs/swagger';
import { CreateZoneDto } from '@/modules/zone/dto';

export class UpdateZoneDto extends PartialType(CreateZoneDto) {}
