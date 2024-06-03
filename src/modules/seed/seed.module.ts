import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { FamilyHouseModule } from '@/modules/family-house/family-house.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { UserModule } from '@/modules/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { ZoneModule } from '@/modules/zone/zone.module';
import { ChurchModule } from '@/modules/church/church.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [
    ChurchModule,
    PastorModule,
    CopastorModule,
    SupervisorModule,
    ZoneModule,
    PreacherModule,
    FamilyHouseModule,
    DiscipleModule,
    AuthModule,
    UserModule,
    ConfigModule,
  ],
})
export class SeedModule {}
