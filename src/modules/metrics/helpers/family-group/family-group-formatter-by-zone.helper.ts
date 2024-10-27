import { RecordStatus } from '@/common/enums';
import { getInitialFullNames } from '@/common/helpers';

import { Zone } from '@/modules/zone/entities';

interface Options {
  zones: Zone[];
}

export const familyGroupFormatterByZone = ({ zones }: Options) => {
  const result = zones.reduce((acc, zone) => {
    const filteredFamilyGroups = zone.familyGroups.filter(
      (zone) => zone.recordStatus === RecordStatus.Active,
    ).length;

    acc[zone.zoneName] = {
      supervisor: zone?.theirSupervisor?.firstName
        ? `${getInitialFullNames({ firstNames: zone?.theirSupervisor?.firstName ?? '', lastNames: '' })} ${zone?.theirSupervisor?.lastName}`
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
