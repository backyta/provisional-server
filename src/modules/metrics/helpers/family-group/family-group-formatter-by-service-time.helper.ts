import { getInitialFullNames } from '@/common/helpers';
import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

export const familyGroupFormatterByServiceTime = ({
  familyGroups,
}: Options) => {
  const result = familyGroups.reduce(
    (acc, familyGroup) => {
      if (!acc[familyGroup.serviceTime]) {
        acc[familyGroup.serviceTime] = {
          serviceTimesCount: 0,
          supervisor: familyGroup?.theirSupervisor?.firstName
            ? `${getInitialFullNames({ firstNames: familyGroup?.theirSupervisor?.firstName ?? '', lastNames: '' })} ${familyGroup?.theirSupervisor?.lastName}`
            : familyGroup?.theirSupervisor?.firstName === undefined
              ? ''
              : 'Sin Supervisor',
          church: {
            isAnexe: familyGroups[0]?.theirChurch?.isAnexe,
            abbreviatedChurchName:
              familyGroups[0]?.theirChurch?.abbreviatedChurchName,
          },
        };
      }

      acc[familyGroup.serviceTime].serviceTimesCount += 1;

      return acc;
    },
    {} as Record<
      string,
      {
        serviceTimesCount: number;
        supervisor: string;
        church: { isAnexe: boolean; abbreviatedChurchName: string };
      }
    >,
  );

  return result;
};
