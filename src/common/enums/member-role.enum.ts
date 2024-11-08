export enum MemberRole {
  Pastor = 'pastor',
  Copastor = 'copastor',
  Supervisor = 'supervisor',
  Preacher = 'preacher',
  Treasurer = 'treasurer',
  Disciple = 'disciple',
}

export const MemberRoleNames: Record<MemberRole, string> = {
  [MemberRole.Pastor]: 'Pastor',
  [MemberRole.Copastor]: 'Co-Pastor',
  [MemberRole.Supervisor]: 'Supervisor',
  [MemberRole.Preacher]: 'Predicador',
  [MemberRole.Treasurer]: 'Tesorero',
  [MemberRole.Disciple]: 'Discípulo',
};

// NOTE : preguntar si se requeriara Disicupulo + Pastor o solo pastor porque discipulo ya esta implicito. ???
