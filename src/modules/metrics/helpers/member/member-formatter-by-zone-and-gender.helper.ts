import { Zone } from '@/modules/zone/entities';

import { Gender } from '@/common/enums';
import { getInitialFullNames } from '@/common/helpers';

interface Options {
  zones: Zone[];
}

export const memberFormatterByZoneAndGender = ({ zones }: Options) => {
  const result = zones.reduce(
    (acc, zone) => {
      const menCount = zone.disciples.filter(
        (disciple) => disciple.gender === Gender.Male,
      ).length;

      const womenCount = zone.disciples.filter(
        (disciple) => disciple.gender === Gender.Female,
      ).length;

      acc[zone.zoneName] = {
        supervisor: zone?.theirSupervisor?.firstName
          ? `${getInitialFullNames({ firstNames: zone?.theirSupervisor?.firstName ?? '', lastNames: '' })} ${zone?.theirSupervisor?.lastName}`
          : 'Sin Supervisor',
        men: menCount,
        women: womenCount,
        church: {
          isAnexe: zones[0]?.theirChurch?.isAnexe,
          abbreviatedChurchName: zones[0]?.theirChurch?.abbreviatedChurchName,
        },
      };

      return acc;
    },
    {} as Record<
      string,
      {
        supervisor: string;
        men: number;
        women: number;
        church: {
          isAnexe: boolean;
          abbreviatedChurchName: string;
        };
      }
    >,
  );

  return result;
};

// TODO : tipar las salidas de los resultados
