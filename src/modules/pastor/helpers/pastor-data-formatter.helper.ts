import { Pastor } from '@/modules/pastor/entities';

interface Options {
  pastors: Pastor[];
}

export const pastorDataFormatter = ({ pastors }: Options) => {
  return pastors.map((pastor) => ({
    ...pastor,
    theirChurch: {
      id: pastor.theirChurch?.id,
      churchName: pastor.theirChurch?.churchName,
    },
    copastors: pastor?.copastors.map((copastor) => ({
      id: copastor?.id,
      firstName: copastor?.firstName,
      lastName: copastor?.lastName,
    })),
    supervisors: pastor?.supervisors.map((supervisor) => ({
      id: supervisor?.id,
      firstName: supervisor?.firstName,
      lastName: supervisor?.lastName,
    })),
    zones: pastor?.zones.map((zone) => ({
      id: zone?.id,
      zoneName: zone?.zoneName,
      district: zone?.district,
    })),
    preachers: pastor?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstName: preacher?.firstName,
      lastName: preacher?.lastName,
    })),
    familyGroups: pastor?.familyGroups.map((familyGroup) => ({
      id: familyGroup?.id,
      familyGroupName: familyGroup?.familyGroupName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.district,
      urbanSector: familyGroup?.urbanSector,
      theirZone: familyGroup.theirZone,
    })),
    disciples: pastor.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.firstName,
      lastName: disciple?.lastName,
    })),
  }));
};
