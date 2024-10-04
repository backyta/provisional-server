import { Gender } from '@/common/enums';
import { getInitialFullNames } from '@/common/helpers';

import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

export const familyGroupFormatterByCode = ({ familyGroups }: Options) => {
  const result = familyGroups.reduce((acc, familyGroup, index) => {
    const menCount = familyGroup.disciples.filter(
      (disciple) => disciple.gender === Gender.Male,
    ).length;

    const womenCount = familyGroup.disciples.filter(
      (disciple) => disciple.gender === Gender.Female,
    ).length;

    acc[`familyGroup-${index + 1}`] = {
      preacher: familyGroup?.theirPreacher?.firstName
        ? `${getInitialFullNames({ firstNames: familyGroup?.theirPreacher?.firstName, lastNames: '' })} ${familyGroup?.theirPreacher?.lastName}`
        : 'Sin Predicador',
      familyGroupCode: familyGroup.familyGroupCode,
      men: menCount,
      women: womenCount,
    };

    return acc;
  }, {});

  return result;
};
