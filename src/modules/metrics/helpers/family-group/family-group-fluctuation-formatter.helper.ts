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

interface ChurchInfo {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}
//TODO : cambiar por ResultData
interface MonthlyFluctuationData {
  month: string;
  newFamilyGroups: number;
  inactiveFamilyGroups: number;
  church: ChurchInfo;
}

export const familyGroupFluctuationFormatter = ({
  activeFamilyGroups,
  inactiveFamilyGroups,
}: Options): MonthlyFluctuationData[] => {
  const filterFamilyGroupsByMonth = (
    familyGroups: FamilyGroup[],
    monthIndex: number,
  ) =>
    familyGroups.filter(
      (member) => new Date(member.createdAt).getMonth() === monthIndex,
    );

  const resultData: MonthlyFluctuationData[] = monthNames.map((_, index) => {
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
