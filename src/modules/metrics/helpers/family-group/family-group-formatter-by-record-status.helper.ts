import { RecordStatus } from '@/common/enums';
import { getInitialFullNames } from '@/common/helpers';
import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

interface SupervisorInfo {
  supervisor: string;
  active: number;
  inactive: number;
  church: {
    isAnexe: boolean;
    abbreviatedChurchName: string;
  };
}

type ZoneRecordStatusResult = {
  [zoneName: string]: SupervisorInfo;
};

export const familyGroupFormatterByRecordStatus = ({
  familyGroups,
}: Options) => {
  const result: ZoneRecordStatusResult = familyGroups.reduce(
    (acc, familyGroup) => {
      const zoneName = familyGroup.theirZone?.zoneName;

      if (!acc[zoneName]) {
        acc[zoneName] = {
          supervisor: familyGroup?.theirSupervisor?.member?.firstName
            ? `${getInitialFullNames({
                firstNames:
                  familyGroup?.theirSupervisor?.member?.firstName ?? '',
                lastNames: '',
              })} ${familyGroup?.theirSupervisor?.member?.lastName}`
            : 'Sin Supervisor',
          active: 0,
          inactive: 0,
          church: {
            isAnexe: familyGroups[0]?.theirChurch?.isAnexe,
            abbreviatedChurchName:
              familyGroups[0]?.theirChurch?.abbreviatedChurchName,
          },
        };
      }

      acc[zoneName].active +=
        familyGroup.recordStatus === RecordStatus.Active ? 1 : 0;
      acc[zoneName].inactive +=
        familyGroup.recordStatus === RecordStatus.Inactive ? 1 : 0;

      return acc;
    },
    {},
  );

  return result;
};
