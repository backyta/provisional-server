import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

export const familyGroupFormatterByDistrict = ({ familyGroups }: Options) => {
  const result = familyGroups.reduce((acc, item) => {
    if (!acc[item.urbanSector]) {
      acc[item.urbanSector] = {
        familyGroupsCount: 0,
      };
    }

    acc[item.urbanSector].familyGroupsCount += 1;

    return acc;
  }, {});

  const sortedResult = Object.keys(result)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = result[key];
        return acc;
      },
      {} as Record<string, { familyGroupsCount: number }>,
    );

  return sortedResult;
};
