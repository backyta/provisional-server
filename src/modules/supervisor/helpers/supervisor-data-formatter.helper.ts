import { Supervisor } from '@/modules/supervisor/entities';

interface Options {
  supervisors: Supervisor[];
}

export const supervisorDataFormatter = ({ supervisors }: Options) => {
  return supervisors.map((supervisor) => ({
    ...supervisor,
    theirChurch: {
      id: supervisor?.theirChurch?.id,
      churchName: supervisor?.theirChurch?.churchName,
      abbreviatedChurchName: supervisor?.theirChurch?.abbreviatedChurchName,
      district: supervisor?.theirChurch?.district,
      urbanSector: supervisor?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: supervisor?.theirPastor?.id,
      firstName: supervisor?.theirPastor?.member?.firstName,
      lastName: supervisor?.theirPastor?.member?.lastName,
      roles: supervisor?.theirPastor?.member?.roles,
    },
    theirCopastor: {
      id: supervisor?.theirCopastor?.id,
      firstName: supervisor?.theirCopastor?.member?.firstName,
      lastName: supervisor?.theirCopastor?.member?.lastName,
      roles: supervisor?.theirCopastor?.member?.roles,
    },
    theirZone: {
      id: supervisor?.theirZone?.id,
      zoneName: supervisor?.theirZone?.zoneName,
      department: supervisor?.theirZone?.department,
      province: supervisor?.theirZone?.province,
      district: supervisor?.theirZone?.district,
    },
    preachers: supervisor?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstName: preacher?.member?.firstName,
      lastName: preacher?.member?.lastName,
    })),
    familyGroups: supervisor?.familyGroups.map((familyGroup) => ({
      id: familyGroup?.id,
      familyGroupName: familyGroup?.familyGroupName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.district,
      urbanSector: familyGroup?.urbanSector,
      theirZone: familyGroup.theirZone,
    })),
    disciples: supervisor?.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.member?.firstName,
      lastName: disciple?.member?.lastName,
    })),
  }));
};
