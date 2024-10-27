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

interface ResultDataOptions {
  month: string;
  newMembers: number;
  inactiveMembers: number;
  church: {
    isAnexe: boolean;
    abbreviatedChurchName: string;
  };
}

export const memberFluctuationFormatter = ({
  newMembers,
  inactiveMembers,
}: Options) => {
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

  const resultData: ResultDataOptions[] = monthNames.map((_, index) => {
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
  });

  return resultData;
};
