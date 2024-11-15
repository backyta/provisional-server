import { MemberRole, RecordStatus } from '@/common/enums';

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

interface RecordStatusCounts {
  church: {
    isAnexe: boolean;
    abbreviatedChurchName: string;
  };
  active: number;
  inactive: number;
}

// Interfaz para el resultado de la función
export interface MembersByRecordStatusResultData {
  pastor: RecordStatusCounts;
  copastor: RecordStatusCounts;
  supervisor: RecordStatusCounts;
  preacher: RecordStatusCounts;
  disciple: RecordStatusCounts;
}

export const memberFormatterByRecordStatus = ({
  pastors,
  copastors,
  supervisors,
  preachers,
  disciples,
}: Options): MembersByRecordStatusResultData => {
  const allMembers = [
    ...pastors,
    ...copastors,
    ...supervisors,
    ...preachers,
    ...disciples,
  ];

  const membersByRecordStatus: MembersByRecordStatusResultData = {
    pastor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      active: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Pastor) &&
          item.recordStatus === RecordStatus.Active,
      ).length,
      inactive: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Pastor) &&
          item.recordStatus === RecordStatus.Inactive,
      ).length,
    },
    copastor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      active: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Copastor) &&
          item.recordStatus === RecordStatus.Active,
      ).length,
      inactive: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Copastor) &&
          item.recordStatus === RecordStatus.Inactive,
      ).length,
    },
    supervisor: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      active: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Supervisor) &&
          item.recordStatus === RecordStatus.Active,
      ).length,
      inactive: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Supervisor) &&
          item.recordStatus === RecordStatus.Inactive,
      ).length,
    },
    preacher: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      active: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Preacher) &&
          item.recordStatus === RecordStatus.Active,
      ).length,
      inactive: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Preacher) &&
          item.recordStatus === RecordStatus.Inactive,
      ).length,
    },
    disciple: {
      church: {
        isAnexe: allMembers[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          allMembers[0]?.theirChurch?.abbreviatedChurchName,
      },
      active: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Disciple) &&
          !item?.member?.roles.includes(MemberRole.Pastor) &&
          !item?.member?.roles.includes(MemberRole.Copastor) &&
          !item?.member?.roles.includes(MemberRole.Supervisor) &&
          !item?.member?.roles.includes(MemberRole.Preacher) &&
          !item?.member?.roles.includes(MemberRole.Treasurer) &&
          item.recordStatus === RecordStatus.Active,
      ).length,
      inactive: allMembers.filter(
        (item) =>
          item?.member?.roles.includes(MemberRole.Disciple) &&
          !item?.member?.roles.includes(MemberRole.Pastor) &&
          !item?.member?.roles.includes(MemberRole.Copastor) &&
          !item?.member?.roles.includes(MemberRole.Supervisor) &&
          !item?.member?.roles.includes(MemberRole.Preacher) &&
          !item?.member?.roles.includes(MemberRole.Treasurer) &&
          item.recordStatus === RecordStatus.Inactive,
      ).length,
    },
  };

  return membersByRecordStatus;
};
