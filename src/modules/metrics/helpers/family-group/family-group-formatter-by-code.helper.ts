import { Gender } from '@/common/enums';
import { getInitialFullNames } from '@/common/helpers';

import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

export interface FamilyGroupsByCodeResultData {
  preacher: string;
  familyGroupCode: string;
  men: number;
  women: number;
  church: {
    isAnexe: boolean;
    abbreviatedChurchName: string;
  };
}

type FamilyGroupResult = {
  [key: string]: FamilyGroupsByCodeResultData;
};

export const familyGroupFormatterByCode = ({ familyGroups }: Options) => {
  const result: FamilyGroupResult = familyGroups.reduce(
    (acc, familyGroup, index) => {
      const menCount = familyGroup.disciples.filter(
        (disciple) => disciple?.member?.gender === Gender.Male,
      ).length;

      const womenCount = familyGroup.disciples.filter(
        (disciple) => disciple?.member?.gender === Gender.Female,
      ).length;

      acc[`familyGroup-${index + 1}`] = {
        preacher: familyGroup?.theirPreacher?.member?.firstName
          ? `${getInitialFullNames({ firstNames: familyGroup?.theirPreacher?.member?.firstName ?? '', lastNames: '' })} ${familyGroup?.theirPreacher?.member?.lastName}`
          : 'Sin Predicador',
        familyGroupCode: familyGroup.familyGroupCode,
        men: menCount,
        women: womenCount,
        church: {
          isAnexe: familyGroups[0]?.theirChurch?.isAnexe,
          abbreviatedChurchName:
            familyGroups[0]?.theirChurch?.abbreviatedChurchName,
        },
      };

      return acc;
    },
    {},
  );

  return result;
};
