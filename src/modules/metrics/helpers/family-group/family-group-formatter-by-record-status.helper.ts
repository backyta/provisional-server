import { RecordStatus } from '@/common/enums';
import { getInitialFullNames } from '@/common/helpers';
import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

export const familyGroupFormatterByRecordStatus = ({
  familyGroups,
}: Options) => {
  const result = familyGroups.reduce(
    (acc, familyGroup) => {
      const zoneName = familyGroup.theirZone?.zoneName;

      if (!acc[zoneName]) {
        acc[zoneName] = {
          supervisor: familyGroup?.theirSupervisor?.firstName
            ? `${getInitialFullNames({ firstNames: familyGroup?.theirSupervisor?.firstName ?? '', lastNames: '' })} ${familyGroup?.theirSupervisor?.lastName}`
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
    {} as Record<
      string,
      {
        active: number;
        inactive: number;
        supervisor: string;
        church: { isAnexe: boolean; abbreviatedChurchName: string };
      }
    >,
  );

  return result;
};
