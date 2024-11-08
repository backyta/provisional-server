import { Pastor } from '@/modules/pastor/entities';

interface Options {
  pastors: Pastor[];
}

export const pastorDataFormatter = ({ pastors }: Options) => {
  return pastors.map((pastor) => ({
    ...pastor,
    theirChurch: {
      id: pastor?.theirChurch?.id,
      churchName: pastor?.theirChurch?.churchName,
      abbreviatedChurchName: pastor?.theirChurch?.abbreviatedChurchName,
    },
    copastors: pastor?.copastors.map((copastor) => ({
      id: copastor?.id,
      firstName: copastor?.member?.firstName,
      lastName: copastor?.member?.lastName,
    })),
    supervisors: pastor?.supervisors.map((supervisor) => ({
      id: supervisor?.id,
      firstName: supervisor?.member?.firstName,
      lastName: supervisor?.member?.lastName,
    })),
    zones: pastor?.zones.map((zone) => ({
      id: zone?.id,
      zoneName: zone?.zoneName,
      district: zone?.district,
    })),
    preachers: pastor?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstName: preacher?.member?.firstName,
      lastName: preacher?.member?.lastName,
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
      firstName: disciple?.member?.firstName,
      lastName: disciple?.member?.lastName,
    })),
  }));
};
