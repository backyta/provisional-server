import { Gender } from '@/common/enums';

import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';

interface Options {
  pastors: Pastor[];
  copastors: Copastor[];
  supervisors: Supervisor[];
  preachers: Preacher[];
  disciples: Disciple[];
}

export const memberFormatterByDistrictAndGender = ({
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

  const result = allMembers.reduce((acc, item) => {
    const menCount = item.gender === Gender.Male ? 1 : 0;
    const womenCount = item.gender === Gender.Female ? 1 : 0;

    if (!acc[item.urbanSector]) {
      acc[item.urbanSector] = {
        men: 0,
        women: 0,
      };
    }

    acc[item.urbanSector].men += menCount;
    acc[item.urbanSector].women += womenCount;

    return acc;
  }, {});

  const sortedResult = Object.keys(result)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = result[key];
        return acc;
      },
      {} as Record<string, { men: number; women: number }>,
    );

  return sortedResult;
};
