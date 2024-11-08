import { Gender, MemberRole } from '@/common/enums';

import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';

interface Options {
  pastors: Pastor[];
  copastors: Copastor[];
  supervisors: Supervisor[];
  preachers: Preacher[];
  disciples: Disciple[];
}

interface Church {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

interface MembersByRole {
  church: Church;
  men: number;
  women: number;
}

// Interfaz para la estructura de salida de memberFormatterByRoleAndGender
interface MemberFormatterResult {
  pastor: MembersByRole;
  copastor: MembersByRole;
  supervisor: MembersByRole;
  preacher: MembersByRole;
  disciple: MembersByRole;
}

export const memberFormatterByRoleAndGender = ({
  pastors,
  copastors,
  supervisors,
  preachers,
  disciples,
}: Options): MemberFormatterResult => {
  const allMembers = [
    ...pastors,
    ...copastors,
    ...supervisors,
    ...preachers,
    ...disciples,
  ];

  const membersByRole: MemberFormatterResult = {
    pastor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      men: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Pastor) &&
          item?.member?.gender === Gender.Male,
      ).length,
      women: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Pastor) &&
          item?.member?.gender === Gender.Female,
      ).length,
    },
    copastor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      men: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Copastor) &&
          item?.member?.gender === Gender.Male,
      ).length,
      women: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Copastor) &&
          item?.member?.gender === Gender.Female,
      ).length,
    },
    supervisor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      men: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Supervisor) &&
          item?.member?.gender === Gender.Male,
      ).length,
      women: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Supervisor) &&
          item?.member?.gender === Gender.Female,
      ).length,
    },
    preacher: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      men: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Preacher) &&
          item?.member?.gender === Gender.Male,
      ).length,
      women: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Preacher) &&
          item?.member?.gender === Gender.Female,
      ).length,
    },
    disciple: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      men: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Disciple) &&
          (!item?.member?.roles.includes(MemberRole.Pastor) ||
            !item?.member?.roles.includes(MemberRole.Copastor) ||
            !item?.member?.roles.includes(MemberRole.Supervisor) ||
            !item?.member?.roles.includes(MemberRole.Preacher) ||
            !item?.member?.roles.includes(MemberRole.Treasurer)) &&
          item?.member?.gender === Gender.Male,
      ).length,
      women: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Disciple) &&
          item?.member?.gender === Gender.Female,
      ).length,
    },
  };

  return membersByRole;
};
