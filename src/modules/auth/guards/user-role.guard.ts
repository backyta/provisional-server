import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { User } from '@/modules/user/entities';
import { META_ROLES } from '@/modules/auth/decorators';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validUserRoles: string = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    if (!validUserRoles) return true;
    if (validUserRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (!user) {
      throw new BadRequestException(`User not found`);
    }

    for (const role of user.roles) {
      if (validUserRoles.includes(role)) {
        return true;
      }
    }

    throw new ForbiddenException(
      `User ${user.firstName}, ${user.lastName} need a valid roles ${validUserRoles}`,
    );
  }
}
