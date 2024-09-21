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

export const memberCountFormatter = ({
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

  const totalCountMembers = allMembers.length;

  const countMembersMale = allMembers.filter(
    (member) => member.gender === Gender.Male,
  ).length;

  const countMembersFemale = allMembers.filter(
    (member) => member.gender === Gender.Female,
  ).length;

  const countMembersActive = allMembers.filter(
    (member) => member.recordStatus === RecordStatus.Active,
  ).length;

  const countMembersInactive = allMembers.filter(
    (member) => member.recordStatus === RecordStatus.Inactive,
  ).length;

  return {
    countMembersMale,
    totalCountMembers,
    countMembersFemale,
    countMembersActive,
    countMembersInactive,
  };
};
