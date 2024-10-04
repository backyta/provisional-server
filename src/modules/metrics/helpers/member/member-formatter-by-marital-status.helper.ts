import { MaritalStatus } from '@/common/enums';

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

export const memberFormatterByMaritalStatus = ({
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

  const membersByMaritalStatus = {
    single: allMembers.filter(
      (member) => member.maritalStatus === MaritalStatus.Single,
    ).length,
    married: allMembers.filter(
      (member) => member.maritalStatus === MaritalStatus.Married,
    ).length,
    divorced: allMembers.filter(
      (member) => member.maritalStatus === MaritalStatus.Divorced,
    ).length,
    windowed: allMembers.filter(
      (member) => member.maritalStatus === MaritalStatus.Widowed,
    ).length,
    other: allMembers.filter(
      (member) => member.maritalStatus === MaritalStatus.Other,
    ).length,
  };

  return membersByMaritalStatus;
};
