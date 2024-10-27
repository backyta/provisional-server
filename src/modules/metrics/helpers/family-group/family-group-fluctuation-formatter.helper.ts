import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  activeFamilyGroups: FamilyGroup[];
  inactiveFamilyGroups: FamilyGroup[];
}

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface ResultDataOptions {
  month: string;
  newFamilyGroups: number;
  inactiveFamilyGroups: number;
  church: {
    isAnexe: boolean;
    abbreviatedChurchName: string;
  };
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
      church: {
        isAnexe: activeFamilyGroups[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName:
          activeFamilyGroups[0]?.theirChurch?.abbreviatedChurchName,
      },
    };
  });

  return resultData;
};
