import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonModule } from '@/common/common.module';

import { ZoneModule } from '@/modules/zone/zone.module';
import { UserModule } from '@/modules/user/user.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { OfferingModule } from '@/modules/offering/offering.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyHouseModule } from '@/modules/family-house/family-house.module';

import { SuperUserService } from '@/utils';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      ssl: process.env.STAGE === 'prod',
      extra: {
        ssl:
          process.env.STAGE === 'prod' ? { rejectUnauthorized: false } : null,
      },
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: process.env.STAGE === 'prod' ? false : true,
    }),
    UserModule,
    DiscipleModule,
    PastorModule,
    CommonModule,
    CopastorModule,
    SupervisorModule,
    PreacherModule,
    FamilyHouseModule,
    ZoneModule,
    OfferingModule,
    ChurchModule,
  ],
  providers: [SuperUserService],
})
export class AppModule {}
