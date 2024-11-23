import { getInitialFullNames } from '@/common/helpers';
import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

interface ServiceTimeInfo {
  serviceTimesCount: number;
  supervisor: string;
  church: {
    isAnexe: boolean;
    abbreviatedChurchName: string;
  };
}

export type FamilyGroupsByServiceTimeDataResult = {
  [serviceTime: string]: ServiceTimeInfo;
};

export const familyGroupFormatterByServiceTime = ({
  familyGroups,
}: Options) => {
  const result: FamilyGroupsByServiceTimeDataResult = familyGroups.reduce(
    (acc, familyGroup) => {
      if (!acc[familyGroup.serviceTime]) {
        acc[familyGroup.serviceTime] = {
          serviceTimesCount: 0,
          supervisor: familyGroup?.theirSupervisor?.member?.firstName
            ? `${getInitialFullNames({
                firstNames:
                  familyGroup?.theirSupervisor?.member?.firstName ?? '',
                lastNames: '',
              })} ${familyGroup?.theirSupervisor?.member?.lastName}`
            : familyGroup?.theirSupervisor?.member?.firstName === undefined
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
    {},
  );

  return result;
};
