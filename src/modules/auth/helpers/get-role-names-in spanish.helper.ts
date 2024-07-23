import { UserRoleNames } from '@/modules/auth/enums';

export const getRoleNamesInSpanish = (validUserRoles: string[]): string[] => {
  return validUserRoles.map((role) => {
    return UserRoleNames[role] ?? role;
  });
};
