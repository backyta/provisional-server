import { Pastor } from '@/modules/pastor/entities';
import { Copastor } from '@/modules/copastor/entities';
import { Disciple } from '@/modules/disciple/entities';
import { Preacher } from '@/modules/preacher/entities';
import { Supervisor } from '@/modules/supervisor/entities';

interface Options {
  newMembers: [Pastor[], Copastor[], Supervisor[], Preacher[], Disciple[]];
  inactiveMembers: [Pastor[], Copastor[], Supervisor[], Preacher[], Disciple[]];
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

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

  const result: Record<string, { new: number; inactive: number }> = {};

  months.forEach((month, index) => {
    result[`membersIn${month}`] = {
      new: filterMembersByMonth(allNewMembers, index).length,
      inactive: filterMembersByMonth(allInactiveMembers, index).length,
    };
  });

  return result;
};
