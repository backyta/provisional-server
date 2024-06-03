import { BadRequestException, Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Auth } from '@/modules/auth/decorators';
import { UserRoles } from '@/modules/auth/enums';

@ApiTags('Seed')
@ApiBearerAuth()
@ApiOkResponse({
  description: 'SEED executed Successful.',
})
@ApiUnauthorizedResponse({
  description: 'Unauthorized Bearer Auth.',
})
@ApiForbiddenResponse({
  description: 'Forbidden.',
})
@ApiInternalServerErrorResponse({
  description: 'Internal server error, check logs.',
})
@Controller('seed')
export class SeedController {
  constructor(
    private readonly seedService: SeedService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Auth(UserRoles.SuperUser)
  executeSeed(): Promise<string> {
    if (this.configService.get('STAGE') === 'prod') {
      throw new BadRequestException('Cannot run seed in production.');
    }
    return this.seedService.runSeed();
  }
}
