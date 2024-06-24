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
import { CreateUserDto } from '@/modules/user/dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  //* Create user
  async register(createUserDto: CreateUserDto, user: User) {
    const { password, ...userData } = createUserDto;

    try {
      const newUser = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
        createdBy: user,
        createdAt: new Date(),
      });

      // TODO : no deberia generarse el token porque es una creacion dentro del sistema no para que ingrese directo
      // NOTE : su ruta deberia ser user/create-user no auth-register (MOVERLO)
      await this.userRepository.save(newUser);
      delete newUser.password;
      return {
        ...newUser,
        token: this.getJetToken({ id: newUser.id }),
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  //* Login user
  async login(loginUserDto: LoginUserDto): Promise<any> {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        firstName: true,
        lastName: true,
        roles: true,
        status: true,
        email: true,
        password: true,
        id: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(`Email or password are not valid`);
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException(`Email or password are not valid`);
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      token: this.getJetToken({ id: user.id }),
    };
  }

  //* Check auth status (regenerate token)
  async checkStatus(user: User) {
    return {
      ...user,
      token: this.getJetToken({ id: user.id }),
    };
  }

  //? PRIVATE METHODS
  // Sign token
  private getJetToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  // For future index errors or constrains with code.
  private handleDBErrors(error: any): never {
    if (error.code == '23505') {
      throw new BadRequestException(error.detail);
    }

    throw new InternalServerErrorException('Please check server logs');
  }
}
