import { Copastor } from '@/modules/copastor/entities';

interface Options {
  copastors: Copastor[];
}

export const formatDataCopastor = ({ copastors }: Options) => {
  return copastors.map((copastor) => ({
    ...copastor,
    theirChurch: {
      id: copastor.theirChurch?.id,
      churchName: copastor.theirChurch?.churchName,
      district: copastor.theirChurch?.district,
      urbanSector: copastor.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: copastor.theirPastor?.id,
      firstName: copastor.theirPastor?.firstName,
      lastName: copastor.theirPastor?.lastName,
      roles: copastor.theirPastor?.roles,
    },
    supervisors: copastor?.supervisors.map((supervisor) => ({
      id: supervisor?.id,
      firstName: supervisor?.firstName,
      lastName: supervisor?.lastName,
    })),
    zones: copastor?.zones.map((zone) => ({
      id: zone?.id,
      zoneName: zone?.zoneName,
      district: zone?.district,
    })),
    preachers: copastor?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstName: preacher?.firstName,
      lastName: preacher?.lastName,
    })),
    familyGroups: copastor?.familyGroups.map((familyGroup) => ({
      id: familyGroup?.id,
      familyGroupName: familyGroup?.familyGroupName,
      zoneName: familyGroup?.zoneName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.district,
      urbanSector: familyGroup?.urbanSector,
    })),
    disciples: copastor.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.firstName,
      lastName: disciple?.lastName,
    })),
  }));
};
