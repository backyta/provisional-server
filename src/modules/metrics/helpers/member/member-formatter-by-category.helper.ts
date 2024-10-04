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

export const memberFormatterByCategory = ({
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

  const membersByCategory = {
    child: allMembers.filter((member) => member.age >= 0 && member.age <= 12)
      .length,
    teenager: allMembers.filter(
      (member) => member.age >= 13 && member.age <= 17,
    ).length,
    youth: allMembers.filter((member) => member.age >= 18 && member.age <= 29)
      .length,
    adult: allMembers.filter((member) => member.age >= 30 && member.age <= 59)
      .length,
    middleAged: allMembers.filter(
      (member) => member.age >= 60 && member.age <= 74,
    ).length,
    senior: allMembers.filter((member) => member.age >= 75).length,
  };

  return membersByCategory;
};
