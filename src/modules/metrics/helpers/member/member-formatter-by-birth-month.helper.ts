import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';

const monthNames = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

interface Options {
  pastors: Pastor[];
  copastors: Copastor[];
  supervisors: Supervisor[];
  preachers: Preacher[];
  disciples: Disciple[];
}

interface ResultDataOptions {
  month: string;
  membersCount: number;
  averageAge: string | number;
}

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

  const memberByBirthMonth = monthNames.map((_, index) =>
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

  const resultData: ResultDataOptions[] = monthNames.map((_, index) => {
    return {
      month: monthNames[index],
      ...calculateMemberData(memberByBirthMonth[index]),
    };
  });

  return resultData;
};
