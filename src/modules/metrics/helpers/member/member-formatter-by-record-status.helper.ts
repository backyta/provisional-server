import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';
import { MemberRole, RecordStatus } from '@/common/enums';

interface Options {
  pastors: Pastor[];
  copastors: Copastor[];
  supervisors: Supervisor[];
  preachers: Preacher[];
  disciples: Disciple[];
}

export const memberFormatterByRecordStatus = ({
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

  const membersByRecordStatus = {
    pastor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      active: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Pastor) &&
          member.recordStatus === RecordStatus.Active,
      ).length,
      inactive: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Pastor) &&
          member.recordStatus === RecordStatus.Inactive,
      ).length,
    },
    copastor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      active: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Copastor) &&
          member.recordStatus === RecordStatus.Active,
      ).length,
      inactive: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Copastor) &&
          member.recordStatus === RecordStatus.Inactive,
      ).length,
    },
    supervisor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      active: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Supervisor) &&
          member.recordStatus === RecordStatus.Active,
      ).length,
      inactive: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Supervisor) &&
          member.recordStatus === RecordStatus.Inactive,
      ).length,
    },
    preacher: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      active: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Preacher) &&
          member.recordStatus === RecordStatus.Active,
      ).length,
      inactive: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Preacher) &&
          member.recordStatus === RecordStatus.Inactive,
      ).length,
    },
    disciple: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      active: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Disciple) &&
          !member.roles.includes(MemberRole.Pastor) &&
          !member.roles.includes(MemberRole.Copastor) &&
          !member.roles.includes(MemberRole.Supervisor) &&
          !member.roles.includes(MemberRole.Preacher) &&
          !member.roles.includes(MemberRole.Treasurer) &&
          member.recordStatus === RecordStatus.Active,
      ).length,
      inactive: allMembers.filter(
        (member) =>
          member.roles.includes(MemberRole.Disciple) &&
          !member.roles.includes(MemberRole.Pastor) &&
          !member.roles.includes(MemberRole.Copastor) &&
          !member.roles.includes(MemberRole.Supervisor) &&
          !member.roles.includes(MemberRole.Preacher) &&
          !member.roles.includes(MemberRole.Treasurer) &&
          member.recordStatus === RecordStatus.Inactive,
      ).length,
    },
  };

  return membersByRecordStatus;
};
