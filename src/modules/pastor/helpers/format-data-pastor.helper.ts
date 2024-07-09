import { Pastor } from '@/modules/pastor/entities';

interface Options {
  pastors: Pastor[];
}

export const formatDataPastor = ({ pastors }: Options) => {
  return pastors.map((pastor) => ({
    ...pastor,
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
      zoneName: familyGroup?.zoneName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.disciples,
      urbanSector: familyGroup?.urbanSector,
    })),
    disciples: pastor.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.firstName,
      lastName: disciple?.lastName,
    })),
  }));
};
