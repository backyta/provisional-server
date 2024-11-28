import { Church } from '@/modules/church/entities';

export interface Options {
  churches: Church[];
  mainChurch?: Church;
}

export const churchDataFormatter = ({ churches, mainChurch }: Options) => {
  return churches.map((church) => ({
    ...church,
    theirMainChurch: church.isAnexe
      ? {
          id: mainChurch?.id,
          churchName: mainChurch?.churchName,
          abbreviatedChurchName: mainChurch?.abbreviatedChurchName,
          district: mainChurch?.district,
          urbanSector: mainChurch?.urbanSector,
        }
      : null,
    anexes: church.anexes.map((anexe) => ({
      id: anexe?.id,
      churchName: anexe?.churchName,
      district: anexe?.district,
      urbanSector: anexe?.urbanSector,
    })),
    pastors: church?.pastors.map((pastor) => ({
      id: pastor?.id,
      firstName: pastor?.member?.firstName,
      lastName: pastor?.member?.lastName,
    })),
    copastors: church?.copastors.map((copastor) => ({
      id: copastor?.id,
      firstName: copastor?.member?.firstName,
      lastName: copastor?.member?.lastName,
    })),
    supervisors: church?.supervisors.map((supervisor) => ({
      id: supervisor?.id,
      firstName: supervisor?.member?.firstName,
      lastName: supervisor?.member?.lastName,
    })),
    zones: church?.zones.map((zone) => ({
      id: zone?.id,
      zoneName: zone?.zoneName,
      district: zone?.district,
    })),
    preachers: church?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstName: preacher?.member?.firstName,
      lastName: preacher?.member?.lastName,
    })),
    familyGroups: church?.familyGroups.map((familyGroup) => ({
      id: familyGroup?.id,
      familyGroupName: familyGroup?.familyGroupName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.district,
      urbanSector: familyGroup?.urbanSector,
    })),
    disciples: church.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.member?.firstName,
      lastName: disciple?.member?.lastName,
    })),
  }));
};
