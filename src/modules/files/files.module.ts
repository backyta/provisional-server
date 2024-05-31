import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [CloudinaryModule, AuthModule],
  controllers: [FilesController],
  providers: [],
})
export class FilesModule {}
