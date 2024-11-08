import { Zone } from '@/modules/zone/entities';

interface Options {
  zones: Zone[];
}

export const zoneDataFormatter = ({ zones }: Options) => {
  return zones.map((zone) => ({
    ...zone,
    theirChurch: {
      id: zone?.theirChurch?.id,
      churchName: zone?.theirChurch?.churchName,
      abbreviatedChurchName: zone?.theirChurch?.abbreviatedChurchName,
      district: zone?.theirChurch?.district,
      urbanSector: zone?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: zone?.theirPastor?.id,
      firstName: zone?.theirPastor?.member?.firstName,
      lastName: zone?.theirPastor?.member?.lastName,
      roles: zone?.theirPastor?.member?.roles,
    },
    theirCopastor: {
      id: zone?.theirCopastor?.id,
      firstName: zone?.theirCopastor?.member?.firstName,
      lastName: zone?.theirCopastor?.member?.lastName,
      roles: zone?.theirCopastor?.member?.roles,
    },
    theirSupervisor: {
      id: zone?.theirSupervisor?.id,
      firstName: zone?.theirSupervisor?.member?.firstName,
      lastName: zone?.theirSupervisor?.member?.lastName,
      roles: zone?.theirSupervisor?.member?.roles,
    },
    preachers: zone?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstName: preacher?.member?.firstName,
      lastName: preacher?.member?.lastName,
    })),
    familyGroups: zone?.familyGroups.map((familyGroup) => ({
      id: familyGroup?.id,
      familyGroupName: familyGroup?.familyGroupName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.district,
      urbanSector: familyGroup?.urbanSector,
      theirZone: familyGroup?.theirZone,
    })),
    disciples: zone?.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.member?.firstName,
      lastName: disciple?.member?.lastName,
    })),
  }));
};
