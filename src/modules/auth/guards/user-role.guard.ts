import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { User } from '@/modules/user/entities';
import { META_ROLES } from '@/modules/auth/decorators';
import { getRoleNamesInSpanish } from '@/modules/auth/helpers';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validUserRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    if (!validUserRoles) return true;
    if (validUserRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (!user) {
      throw new BadRequestException(`Usuario no encontrado.`);
    }

    for (const role of user.roles) {
      if (validUserRoles.includes(role)) {
        return true;
      }
    }

    throw new ForbiddenException(
      `Operación rechazada, usuario ${user.firstNames} ${user.lastNames} necesita los roles de acceso: ${getRoleNamesInSpanish(validUserRoles)}`,
    );
  }
}
