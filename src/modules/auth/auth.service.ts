/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { LoginUserDto } from '@/modules/auth/dto';
import { JwtPayload } from '@/modules/auth/interfaces';

import { User } from '@/modules/user/entities';
import { RecordStatus } from '@/common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  //* Login user
  async login(loginUserDto: LoginUserDto): Promise<any> {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        firstName: true,
        lastName: true,
        roles: true,
        recordStatus: true,
        email: true,
        gender: true,
        password: true,
        id: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        `Credenciales invalidas, revise el correo y la contraseña.`,
      );
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException(
        `Credenciales invalidas, revise el correo y la contraseña.`,
      );
    }

    if (user.recordStatus === RecordStatus.Inactive) {
      throw new UnauthorizedException(
        `Credenciales bloqueadas, este usuario no tiene acceso.`,
      );
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  //* Check auth status (regenerate token)
  async checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  //? PRIVATE METHODS
  //* Sign token
  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }
}
