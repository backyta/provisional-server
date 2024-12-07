import { Module } from '@nestjs/common';
import { ExternalDonorService } from './external-donor.service';
import { ExternalDonorController } from './external-donor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalDonor } from '@/modules/external-donor/entities';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  controllers: [ExternalDonorController],
  providers: [ExternalDonorService],
  imports: [TypeOrmModule.forFeature([ExternalDonor]), AuthModule],
  exports: [TypeOrmModule, ExternalDonorService],
})
export class ExternalDonorModule {}
