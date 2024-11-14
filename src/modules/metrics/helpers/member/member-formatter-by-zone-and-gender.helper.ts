import { Zone } from '@/modules/zone/entities';

import { Gender } from '@/common/enums';
import { getInitialFullNames } from '@/common/helpers';

interface Options {
  zones: Zone[];
}

interface Church {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

export interface MembersByZoneResultData {
  [zoneName: string]: {
    supervisor: string;
    men: number;
    women: number;
    church: Church;
  };
}

export const memberFormatterByZoneAndGender = ({ zones }: Options) => {
  const result: MembersByZoneResultData = zones.reduce((acc, zone) => {
    const menCount = zone.disciples.filter(
      (disciple) => disciple?.member?.gender === Gender.Male,
    ).length;

    const womenCount = zone.disciples.filter(
      (disciple) => disciple?.member?.gender === Gender.Female,
    ).length;

    acc[zone.zoneName] = {
      supervisor: zone?.theirSupervisor?.member?.firstName
        ? `${getInitialFullNames({ firstNames: zone?.theirSupervisor?.member?.firstName ?? '', lastNames: '' })} ${zone?.theirSupervisor?.member?.lastName}`
        : 'Sin Supervisor',
      men: menCount,
      women: womenCount,
      church: {
        isAnexe: zones[0]?.theirChurch?.isAnexe,
        abbreviatedChurchName: zones[0]?.theirChurch?.abbreviatedChurchName,
      },
    };

    return acc;
  }, {});

  return result;
};
