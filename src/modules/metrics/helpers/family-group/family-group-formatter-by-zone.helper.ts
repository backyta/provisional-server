import { RecordStatus } from '@/common/enums';
import { getInitialFullNames } from '@/common/helpers';

import { Zone } from '@/modules/zone/entities';

interface Options {
  zones: Zone[];
}

interface ZoneChurchInfo {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

interface ZoneInfo {
  supervisor: string;
  copastor: string;
  familyGroupsCount: number;
  church: ZoneChurchInfo;
}

export type FamilyGroupsByZoneDataResult = {
  [zoneName: string]: ZoneInfo;
};

export const familyGroupFormatterByZone = ({ zones }: Options) => {
  const result: FamilyGroupsByZoneDataResult = zones.reduce((acc, zone) => {
    const filteredFamilyGroups = zone.familyGroups.filter(
      (zone) => zone.recordStatus === RecordStatus.Active,
    ).length;

    acc[zone.zoneName] = {
      copastor: zone?.theirCopastor?.member?.firstNames
        ? `${getInitialFullNames({
            firstNames: zone?.theirCopastor?.member?.firstNames ?? '',
            lastNames: '',
          })} ${zone?.theirCopastor?.member?.lastNames}`
        : 'Sin Co-Pastor',
      supervisor: zone?.theirSupervisor?.member?.firstNames
        ? `${getInitialFullNames({
            firstNames: zone?.theirSupervisor?.member?.firstNames ?? '',
            lastNames: '',
          })} ${zone?.theirSupervisor?.member?.lastNames}`
        : 'Sin Supervisor',
      familyGroupsCount: filteredFamilyGroups,
      church: {
        isAnexe: zones[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName: zones[0]?.theirChurch?.abbreviatedChurchName,
      },
    };

    return acc;
  }, {});

  return result;
};
