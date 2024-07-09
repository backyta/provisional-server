import { PartialType } from '@nestjs/swagger';
import { CreateFamilyGroupDto } from '@/modules/family-group/dto';

export class UpdateFamilyGroupDto extends PartialType(CreateFamilyGroupDto) {}
