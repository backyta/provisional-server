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

interface ChurchInfo {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

interface MembersByCategoryAndGender {
  men: number;
  women: number;
  church: ChurchInfo;
}

export interface MembersByCategoryAndGenderDataResult {
  [category: string]: MembersByCategoryAndGender; // Resultado agrupado por sector urbano
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
}: Options): MembersByCategoryAndGenderDataResult => {
  const allMembers = [
    ...pastors,
    ...copastors,
    ...supervisors,
    ...preachers,
    ...disciples,
  ];

  const dataResult: MembersByCategoryAndGenderDataResult = categories.reduce(
    (acc, category) => {
      const [minAge, maxAge] = category.range;

      acc[category.label] = {
        men: allMembers.filter(
          (item) =>
            item?.member?.gender === Gender.Male &&
            item?.member?.age >= minAge &&
            (maxAge === null || item?.member?.age <= maxAge),
        ).length,
        women: allMembers.filter(
          (item) =>
            item?.member?.gender === Gender.Female &&
            item?.member?.age >= minAge &&
            (maxAge === null || item?.member?.age <= maxAge),
        ).length,
        church: {
          isAnexe: allMembers[0]?.theirChurch?.isAnexe,
          abbreviatedChurchName:
            allMembers[0]?.theirChurch?.abbreviatedChurchName,
        },
      };

      return acc;
    },
    {},
  );

  return dataResult;
};
