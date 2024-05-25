import { Module } from '@nestjs/common';

import { OfferingService } from '@/modules/offering/offering.service';
import { OfferingController } from '@/modules/offering/offering.controller';

@Module({
  controllers: [OfferingController],
  providers: [OfferingService],
})
export class OfferingModule {}
