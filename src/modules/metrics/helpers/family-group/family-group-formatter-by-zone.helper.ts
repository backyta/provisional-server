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

export type FamilyGroupsByZoneResultData = {
  [zoneName: string]: ZoneInfo;
};

export const familyGroupFormatterByZone = ({ zones }: Options) => {
  const result: FamilyGroupsByZoneResultData = zones.reduce((acc, zone) => {
    const filteredFamilyGroups = zone.familyGroups.filter(
      (zone) => zone.recordStatus === RecordStatus.Active,
    ).length;

    acc[zone.zoneName] = {
      copastor: zone?.theirCopastor?.member?.firstName
        ? `${getInitialFullNames({
            firstNames: zone?.theirCopastor?.member?.firstName ?? '',
            lastNames: '',
          })} ${zone?.theirCopastor?.member?.lastName}`
        : 'Sin Co-Pastor',
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
