import { Church } from '@/modules/church/entities';

export interface Options {
  theirMainChurch: Church;
  churches: Church[];
}

export const formatDataChurch = ({ theirMainChurch, churches }: Options) => {
  return churches.map((church) => ({
    ...church,
    theirMainChurch: church.isAnexe ? theirMainChurch : null,
    anexes: church.anexes.map((anexe) => ({
      id: anexe?.id,
      churchName: anexe?.churchName,
      district: anexe?.district,
      urbanSector: anexe?.urbanSector,
    })),
    pastors: church?.pastors.map((pastor) => ({
      id: pastor?.id,
      firstName: pastor?.firstName,
      lastName: pastor?.lastName,
    })),
    copastors: church?.copastors.map((copastor) => ({
      id: copastor?.id,
      firstName: copastor?.firstName,
      lastName: copastor?.lastName,
    })),
    supervisors: church?.supervisors.map((supervisor) => ({
      id: supervisor?.id,
      firstName: supervisor?.firstName,
      lastName: supervisor?.lastName,
    })),
    zones: church?.zones.map((zone) => ({
      id: zone?.id,
      zoneName: zone?.zoneName,
      district: zone?.district,
    })),
    preachers: church?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstName: preacher?.firstName,
      lastName: preacher?.lastName,
    })),
    familyGroups: church?.familyGroups.map((familyGroup) => ({
      id: familyGroup?.id,
      familyGroupName: familyGroup?.familyGroupName,
      zoneName: familyGroup?.zoneName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.disciples,
      urbanSector: familyGroup?.urbanSector,
    })),
    disciples: church.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.firstName,
      lastName: disciple?.lastName,
    })),
  }));
};
