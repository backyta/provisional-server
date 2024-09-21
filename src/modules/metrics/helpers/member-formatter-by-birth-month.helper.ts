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

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const memberFormatterByBirthMonth = ({
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

  const memberByBirthMonth = months.map((_, index) =>
    allMembers.filter(
      (member) => new Date(member.birthDate).getMonth() === index,
    ),
  );

  const calculateMemberData = (members: typeof allMembers) => {
    const membersCount = members.length;
    const averageAge =
      membersCount > 0
        ? (
            members.reduce((sum, member) => sum + member.age, 0) / membersCount
          ).toFixed(0)
        : 0;
    return { membersCount, averageAge };
  };

  const result = months.reduce(
    (acc, month, index) => {
      acc[`membersIn${month}`] = calculateMemberData(memberByBirthMonth[index]);
      return acc;
    },
    {} as Record<string, { membersCount: number; averageAge: string | number }>,
  );

  return result;
};
