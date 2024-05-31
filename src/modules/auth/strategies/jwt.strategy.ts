import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from '@/modules/auth/interfaces';

import { User } from '@/modules/user/entities';
import { Status } from '@/common/enums';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  //* This is used with guards to validate that the token is sent and has access to the routes
  // This method is call if jwt token not expired and sign match with payload (always executed if token that pass 2 validations)
  async validate(payload: JwtPayload): Promise<User> {
    const { id } = payload;

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new UnauthorizedException(`Token not valid`);
    }

    if (user.status === Status.Inactive)
      throw new UnauthorizedException('User is inactive, talk with an admin');

    return user; // Whatever that I returned here is added in request (From the request you have access to this user along the path through which the request passes)
  }
}
