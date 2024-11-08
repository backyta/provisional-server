import { Gender, RecordStatus } from '@/common/enums';

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

export interface MemberProportionResult {
  countMembersMale: number;
  totalCountMembers: number;
  countMembersFemale: number;
  countMembersActive: number;
  countMembersInactive: number;
}

export const memberProportionFormatter = ({
  pastors,
  copastors,
  supervisors,
  preachers,
  disciples,
}: Options): MemberProportionResult => {
  const allMembers = [
    ...pastors,
    ...copastors,
    ...supervisors,
    ...preachers,
    ...disciples,
  ];

  const totalCountMembers = allMembers.length;

  const countMembersMale = allMembers.filter(
    (item) => item?.member?.gender === Gender.Male,
  ).length;

  const countMembersFemale = allMembers.filter(
    (item) => item?.member?.gender === Gender.Female,
  ).length;

  const countMembersActive = allMembers.filter(
    (item) => item?.recordStatus === RecordStatus.Active,
  ).length;

  const countMembersInactive = allMembers.filter(
    (item) => item?.recordStatus === RecordStatus.Inactive,
  ).length;

  return {
    countMembersMale,
    totalCountMembers,
    countMembersFemale,
    countMembersActive,
    countMembersInactive,
  };
};
