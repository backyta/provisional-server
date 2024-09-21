import { Gender } from '@/common/enums';
import { Zone } from '@/modules/zone/entities';

interface Options {
  zones: Zone[];
}

export const preacherFormatterByZoneAndGender = ({ zones }: Options) => {
  const result = zones.reduce((acc, zone) => {
    const menCount = zone.preachers.filter(
      (disciple) => disciple.gender === Gender.Male,
    ).length;

    const womenCount = zone.preachers.filter(
      (disciple) => disciple.gender === Gender.Female,
    ).length;

    acc[zone.zoneName] = {
      supervisor: zone?.theirSupervisor?.firstName
        ? `${zone.theirSupervisor.firstName} ${zone.theirSupervisor.lastName}`
        : 'Sin Supervisor',
      men: menCount,
      women: womenCount,
    };

    return acc;
  }, {});

  return result;
};
