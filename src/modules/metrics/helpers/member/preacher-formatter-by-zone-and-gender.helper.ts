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

export interface PreachersByZoneResultData {
  [zoneName: string]: {
    copastor: string;
    supervisor: string;
    men: number;
    women: number;
    church: Church;
  };
}

export const preacherFormatterByZoneAndGender = ({ zones }: Options) => {
  const result: PreachersByZoneResultData = zones.reduce((acc, zone) => {
    const menCount = zone.preachers.filter(
      (disciple) => disciple?.member?.gender === Gender.Male,
    ).length;

    const womenCount = zone.preachers.filter(
      (disciple) => disciple?.member?.gender === Gender.Female,
    ).length;

    acc[zone.zoneName] = {
      copastor: zone?.theirCopastor?.member?.firstName
        ? `${getInitialFullNames({ firstNames: zone?.theirCopastor?.member?.firstName ?? '', lastNames: '' })} ${zone?.theirCopastor?.member?.lastName}`
        : 'Sin Supervisor',
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
