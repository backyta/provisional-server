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
  familyGroupsCount: number;
  church: ZoneChurchInfo;
}

type ZoneResult = {
  [zoneName: string]: ZoneInfo;
};

export const familyGroupFormatterByZone = ({ zones }: Options) => {
  const result: ZoneResult = zones.reduce((acc, zone) => {
    const filteredFamilyGroups = zone.familyGroups.filter(
      (zone) => zone.recordStatus === RecordStatus.Active,
    ).length;

    acc[zone.zoneName] = {
      supervisor: zone?.theirSupervisor?.member?.firstName
        ? `${getInitialFullNames({
            firstNames: zone?.theirSupervisor?.member?.firstName ?? '',
            lastNames: '',
          })} ${zone?.theirSupervisor?.member?.lastName}`
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
