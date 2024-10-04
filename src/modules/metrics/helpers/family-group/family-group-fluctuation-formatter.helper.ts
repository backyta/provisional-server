import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  activeFamilyGroups: FamilyGroup[];
  inactiveFamilyGroups: FamilyGroup[];
}

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

interface ResultDataOptions {
  month: string;
  newFamilyGroups: number;
  inactiveFamilyGroups: number;
}

export const familyGroupFluctuationFormatter = ({
  activeFamilyGroups,
  inactiveFamilyGroups,
}: Options) => {
  const filterFamilyGroupsByMonth = (
    familyGroups: FamilyGroup[],
    monthIndex: number,
  ) =>
    familyGroups.filter(
      (member) => new Date(member.createdAt).getMonth() === monthIndex,
    );

  const resultData: ResultDataOptions[] = monthNames.map((_, index) => {
    return {
      month: monthNames[index],
      newFamilyGroups: filterFamilyGroupsByMonth(activeFamilyGroups, index)
        .length,
      inactiveFamilyGroups: filterFamilyGroupsByMonth(
        inactiveFamilyGroups,
        index,
      ).length,
    };
  });

  return resultData;
};
