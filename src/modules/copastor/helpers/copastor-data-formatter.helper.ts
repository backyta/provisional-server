import { Copastor } from '@/modules/copastor/entities';

interface Options {
  copastors: Copastor[];
}

export const copastorDataFormatter = ({ copastors }: Options) => {
  return copastors.map((copastor) => ({
    ...copastor,
    theirChurch: {
      id: copastor?.theirChurch?.id,
      churchName: copastor?.theirChurch?.churchName,
      abbreviatedChurchName: copastor?.theirChurch?.abbreviatedChurchName,
      district: copastor?.theirChurch?.district,
      urbanSector: copastor?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: copastor?.theirPastor?.id,
      firstName: copastor?.theirPastor?.member?.firstName,
      lastName: copastor?.theirPastor?.member?.lastName,
      roles: copastor?.theirPastor?.member?.roles,
    },
    supervisors: copastor?.supervisors.map((supervisor) => ({
      id: supervisor?.id,
      firstName: supervisor?.member?.firstName,
      lastName: supervisor?.member?.lastName,
    })),
    zones: copastor?.zones.map((zone) => ({
      id: zone?.id,
      zoneName: zone?.zoneName,
      district: zone?.district,
    })),
    preachers: copastor?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstName: preacher?.member?.firstName,
      lastName: preacher?.member?.lastName,
    })),
    familyGroups: copastor?.familyGroups.map((familyGroup) => ({
      id: familyGroup?.id,
      familyGroupName: familyGroup?.familyGroupName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.district,
      urbanSector: familyGroup?.urbanSector,
      theirZone: familyGroup.theirZone,
    })),
    disciples: copastor.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.member?.firstName,
      lastName: disciple?.member?.lastName,
    })),
  }));
};
