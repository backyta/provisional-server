import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RoleProtected } from '@/modules/auth/decorators';
import { UserRoleGuard } from '@/modules/auth/guards';
import { UserRoles } from '@/modules/auth/enums';

export function Auth(...roles: UserRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
  );
}

// RoleProtected() -> Used to establish the allowed roles in the metadata
// AuthGuard() -> Used to validate with the jwtStrategy and adds the user to the request
// UserRoleGuard() -> Used to remove the user from context and role metadata and validate and allow access
