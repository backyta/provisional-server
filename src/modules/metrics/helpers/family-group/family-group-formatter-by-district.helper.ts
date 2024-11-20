import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

interface ChurchInfo {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

interface FamilyGroupDistrict {
  familyGroupsCount: number;
  district: string;
  church: ChurchInfo;
}

export type FamilyGroupsByDistrictResultData = {
  [urbanSector: string]: FamilyGroupDistrict;
};

export const familyGroupFormatterByDistrict = ({ familyGroups }: Options) => {
  const result: FamilyGroupsByDistrictResultData = familyGroups.reduce(
    (acc, item) => {
      if (!acc[item.urbanSector]) {
        acc[item.urbanSector] = {
          familyGroupsCount: 0,
          district: item.district,
          church: {
            isAnexe: familyGroups[0]?.theirChurch?.isAnexe,
            abbreviatedChurchName:
              familyGroups[0]?.theirChurch?.abbreviatedChurchName,
          },
        };
      }

      acc[item.urbanSector].familyGroupsCount += 1;

      return acc;
    },
    {},
  );

  const sortedResult: FamilyGroupsByDistrictResultData = Object.keys(result)
    .sort()
    .reduce((acc, key) => {
      acc[key] = result[key];
      return acc;
    }, {});

  return sortedResult;
};
