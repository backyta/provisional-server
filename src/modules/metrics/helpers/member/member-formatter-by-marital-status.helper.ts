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

interface MaritalStatusCounts {
  single: number;
  married: number;
  divorced: number;
  windowed: number;
  other: number;
}

export const memberFormatterByMaritalStatus = ({
  pastors,
  copastors,
  supervisors,
  preachers,
  disciples,
}: Options): MaritalStatusCounts => {
  const allMembers = [
    ...pastors,
    ...copastors,
    ...supervisors,
    ...preachers,
    ...disciples,
  ];

  const membersByMaritalStatus: MaritalStatusCounts = {
    single: allMembers.filter(
      (item) => item?.member?.maritalStatus === MaritalStatus.Single,
    ).length,
    married: allMembers.filter(
      (item) => item?.member?.maritalStatus === MaritalStatus.Married,
    ).length,
    divorced: allMembers.filter(
      (item) => item?.member?.maritalStatus === MaritalStatus.Divorced,
    ).length,
    windowed: allMembers.filter(
      (item) => item?.member?.maritalStatus === MaritalStatus.Widowed,
    ).length,
    other: allMembers.filter(
      (item) => item?.member?.maritalStatus === MaritalStatus.Other,
    ).length,
  };

  return membersByMaritalStatus;
};
