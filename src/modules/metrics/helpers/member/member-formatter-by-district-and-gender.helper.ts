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

export interface MembersByDistrictAndGenderDataResult {
  men: number;
  women: number;
  district: string;
  church: {
    isAnexe: boolean;
    abbreviatedChurchName: string;
  };
}

interface DistrictsResult {
  [urbanSector: string]: MembersByDistrictAndGenderDataResult; // Resultado agrupado por sector urbano
}

export const memberFormatterByDistrictAndGender = ({
  pastors,
  copastors,
  supervisors,
  preachers,
  disciples,
}: Options): DistrictsResult => {
  const allMembers = [
    ...pastors,
    ...copastors,
    ...supervisors,
    ...preachers,
    ...disciples,
  ];

  const result: DistrictsResult = allMembers.reduce((acc, item) => {
    const menCount = item?.member?.gender === Gender.Male ? 1 : 0;
    const womenCount = item?.member?.gender === Gender.Female ? 1 : 0;

    if (!acc[item?.member?.urbanSector]) {
      acc[item?.member?.urbanSector] = {
        men: 0,
        women: 0,
        district: item.member.district,
        church: {
          isAnexe: allMembers[0]?.theirChurch?.isAnexe,
          abbreviatedChurchName:
            allMembers[0]?.theirChurch?.abbreviatedChurchName,
        },
      };
    }

    acc[item?.member?.urbanSector].men += menCount;
    acc[item?.member?.urbanSector].women += womenCount;

    return acc;
  }, {});

  const sortedResult = Object.keys(result)
    .sort()
    .reduce((acc, key) => {
      acc[key] = result[key];
      return acc;
    }, {});

  return sortedResult;
};
