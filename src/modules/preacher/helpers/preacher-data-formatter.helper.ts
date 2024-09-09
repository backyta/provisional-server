import { Preacher } from '@/modules/preacher/entities';

interface Options {
  preachers: Preacher[];
}

export const preacherDataFormatter = ({ preachers }: Options) => {
  return preachers.map((preacher) => ({
    ...preacher,
    theirChurch: {
      id: preacher?.theirChurch?.id,
      churchName: preacher?.theirChurch?.churchName,
      district: preacher?.theirChurch?.district,
      urbanSector: preacher?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: preacher?.theirPastor?.id,
      firstName: preacher?.theirPastor?.firstName,
      lastName: preacher?.theirPastor?.lastName,
      roles: preacher?.theirPastor?.roles,
    },
    theirCopastor: {
      id: preacher?.theirCopastor?.id,
      firstName: preacher?.theirCopastor?.firstName,
      lastName: preacher?.theirCopastor?.lastName,
      roles: preacher?.theirCopastor?.roles,
    },
    theirSupervisor: {
      id: preacher?.theirSupervisor?.id,
      firstName: preacher?.theirSupervisor?.firstName,
      lastName: preacher?.theirSupervisor?.lastName,
      roles: preacher?.theirSupervisor?.roles,
    },
    theirZone: {
      id: preacher?.theirZone?.id,
      zoneName: preacher?.theirZone?.zoneName,
      department: preacher?.theirZone?.department,
      province: preacher?.theirZone?.province,
      district: preacher?.theirZone?.district,
    },
    theirFamilyGroup: {
      id: preacher?.theirFamilyGroup?.id,
      familyGroupName: preacher?.theirFamilyGroup?.familyGroupName,
      familyGroupCode: preacher?.theirFamilyGroup?.familyGroupCode,
      district: preacher?.theirFamilyGroup?.district,
      urbanSector: preacher?.theirFamilyGroup?.urbanSector,
    },
    disciples: preacher?.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.firstName,
      lastName: disciple?.lastName,
    })),
  }));
};
