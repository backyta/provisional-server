import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';

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

interface Options {
  newMembers: [Pastor[], Copastor[], Supervisor[], Preacher[], Disciple[]];
  inactiveMembers: [Pastor[], Copastor[], Supervisor[], Preacher[], Disciple[]];
}

interface ChurchInfo {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

interface MonthlyMemberFluctuationData {
  month: string;
  newMembers: number;
  inactiveMembers: number;
  church: ChurchInfo;
}

export const memberFluctuationFormatter = ({
  newMembers,
  inactiveMembers,
}: Options): MonthlyMemberFluctuationData[] => {
  const flattenMembers = (
    members: [Pastor[], Copastor[], Supervisor[], Preacher[], Disciple[]],
  ) => members.flat();

  const allNewMembers = flattenMembers(newMembers);
  const allInactiveMembers = flattenMembers(inactiveMembers);

  const filterMembersByMonth = (
    members: (Pastor | Copastor | Supervisor | Preacher | Disciple)[],
    monthIndex: number,
  ) =>
    members.filter(
      (member) => new Date(member.createdAt).getMonth() === monthIndex,
    );

  const resultData: MonthlyMemberFluctuationData[] = monthNames.map(
    (_, index) => {
      return {
        month: monthNames[index],
        newMembers: filterMembersByMonth(allNewMembers, index).length,
        inactiveMembers: filterMembersByMonth(allInactiveMembers, index).length,
        church: {
          isAnexe: allNewMembers[0]?.theirChurch?.isAnexe,
          abbreviatedChurchName:
            allNewMembers[0]?.theirChurch?.abbreviatedChurchName,
        },
      };
    },
  );

  return resultData;
};
