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

export const memberFormatterByRoleAndGender = ({
  pastors,
  copastors,
  supervisors,
  preachers,
  disciples,
}: Options) => {
  const allMembers = [
    ...pastors,
    ...copastors,
    ...supervisors,
    ...preachers,
    ...disciples,
  ];

  const membersByRole = {
    pastor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      men: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Pastor) &&
          member.gender === Gender.Male,
      ).length,
      women: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Pastor) &&
          member.gender === Gender.Female,
      ).length,
    },
    copastor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      men: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Copastor) &&
          member.gender === Gender.Male,
      ).length,
      women: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Copastor) &&
          member.gender === Gender.Female,
      ).length,
    },
    supervisor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      men: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Supervisor) &&
          member.gender === Gender.Male,
      ).length,
      women: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Supervisor) &&
          member.gender === Gender.Female,
      ).length,
    },
    preacher: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      men: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Preacher) &&
          member.gender === Gender.Male,
      ).length,
      women: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Preacher) &&
          member.gender === Gender.Female,
      ).length,
    },
    disciple: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      men: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Disciple) &&
          (!member.roles.includes(MemberRole.Pastor) ||
            !member.roles.includes(MemberRole.Copastor) ||
            !member.roles.includes(MemberRole.Supervisor) ||
            !member.roles.includes(MemberRole.Preacher) ||
            !member.roles.includes(MemberRole.Treasurer)) &&
          member.gender === Gender.Male,
      ).length,
      women: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Disciple) &&
          member.gender === Gender.Female,
      ).length,
    },
  };

  return membersByRole;
};
