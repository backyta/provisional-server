import { Gender } from '@/common/enums';

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

interface AgeCategory {
  label: string;
  range: [number, number] | [number, null];
}

const categories: AgeCategory[] = [
  { label: 'child', range: [0, 12] },
  { label: 'teenager', range: [13, 17] },
  { label: 'youth', range: [18, 29] },
  { label: 'adult', range: [30, 59] },
  { label: 'middleAged', range: [60, 74] },
  { label: 'senior', range: [75, null] },
];

export const memberFormatterByCategoryAndGender = ({
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

  const membersByCategoryAndGender = categories.reduce(
    (acc, category) => {
      const [minAge, maxAge] = category.range;

      acc[category.label] = {
        men: allMembers.filter(
          (member) =>
            member.gender === Gender.Male &&
            member.age >= minAge &&
            (maxAge === null || member.age <= maxAge),
        ).length,
        women: allMembers.filter(
          (member) =>
            member.gender === Gender.Female &&
            member.age >= minAge &&
            (maxAge === null || member.age <= maxAge),
        ).length,
        church: {
          isAnexe: allMembers[0]?.theirChurch?.isAnexe,
          abbreviatedChurchName:
            allMembers[0]?.theirChurch?.abbreviatedChurchName,
        },
      };

      return acc;
    },
    {} as Record<
      string,
      {
        men: number;
        women: number;
        church: {
          isAnexe: boolean;
          abbreviatedChurchName: string;
        };
      }
    >,
  );

  return membersByCategoryAndGender;
};
