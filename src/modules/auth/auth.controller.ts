import { Controller, Post, Body, Get, HttpCode } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { User } from '@/modules/user/entities';

import { Auth, GetUser } from '@/modules/auth/decorators';

import { LoginUserDto } from '@/modules/auth/dto';
import { AuthService } from '@/modules/auth/auth.service';

@ApiTags('Auth')
@ApiUnauthorizedResponse({
  description: 'Unauthorized Bearer Auth.',
})
@ApiBadRequestResponse({
  description: 'Bad request.',
})
@ApiInternalServerErrorResponse({
  description: 'Internal server error, check logs.',
})
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //* Login
  @Post('login')
  @ApiOkResponse({
    description: 'Successful operation',
  })
  @HttpCode(200)
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  //* Check auth status (regenerate new token)
  @ApiBearerAuth('check-status')
  @Get('check-status')
  @Auth()
  @ApiOkResponse({
    description: 'Successful operation',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden.',
  })
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkStatus(user);
  }
}
