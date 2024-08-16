import { Zone } from '@/modules/zone/entities';

interface Options {
  zones: Zone[];
}

export const zoneDataFormatter = ({ zones }: Options) => {
  return zones.map((zone) => ({
    ...zone,
    theirChurch: {
      id: zone.theirChurch?.id,
      churchName: zone.theirChurch?.churchName,
      district: zone.theirChurch?.district,
      urbanSector: zone.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: zone.theirPastor?.id,
      firstName: zone.theirPastor?.firstName,
      lastName: zone.theirPastor?.lastName,
      roles: zone.theirPastor?.roles,
    },
    theirCopastor: {
      id: zone.theirCopastor?.id,
      firstName: zone.theirCopastor?.firstName,
      lastName: zone.theirCopastor?.lastName,
      roles: zone.theirCopastor?.roles,
    },
    theirSupervisor: {
      id: zone.theirSupervisor?.id,
      firstName: zone.theirSupervisor?.firstName,
      lastName: zone.theirSupervisor?.lastName,
      roles: zone.theirSupervisor?.roles,
    },
    preachers: zone.preachers.map((preacher) => ({
      id: preacher.id,
      firstName: preacher.firstName,
      lastName: preacher.lastName,
    })),
    familyGroups: zone.familyGroups.map((familyGroup) => ({
      id: familyGroup.id,
      familyGroupName: familyGroup.familyGroupName,
      familyGroupCode: familyGroup.familyGroupCode,
      district: familyGroup.district,
      urbanSector: familyGroup.urbanSector,
      theirZone: familyGroup.theirZone,
    })),
    disciples: zone.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.firstName,
      lastName: disciple?.lastName,
    })),
  }));
};
