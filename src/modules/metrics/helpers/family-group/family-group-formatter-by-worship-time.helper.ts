import { getInitialFullNames } from '@/common/helpers';
import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

export const familyGroupFormatterByWorshipTime = ({
  familyGroups,
}: Options) => {
  const result = familyGroups.reduce(
    (acc, familyGroup) => {
      if (!acc[familyGroup.worshipTime]) {
        acc[familyGroup.worshipTime] = {
          worshipTimesCount: 0,
          supervisor: familyGroup?.theirSupervisor?.firstName
            ? `${getInitialFullNames({ firstNames: familyGroup?.theirSupervisor?.firstName ?? '', lastNames: '' })} ${familyGroup?.theirSupervisor?.lastName}`
            : familyGroup?.theirSupervisor?.firstName === undefined
              ? ''
              : 'Sin Supervisor',
        };
      }

      acc[familyGroup.worshipTime].worshipTimesCount += 1;

      return acc;
    },
    {} as Record<string, { worshipTimesCount: number; supervisor: string }>,
  );

  return result;
};
