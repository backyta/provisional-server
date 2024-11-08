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
      abbreviatedChurchName: preacher?.theirChurch?.abbreviatedChurchName,
      district: preacher?.theirChurch?.district,
      urbanSector: preacher?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: preacher?.theirPastor?.id,
      firstName: preacher?.theirPastor?.member?.firstName,
      lastName: preacher?.theirPastor?.member?.lastName,
      roles: preacher?.theirPastor?.member?.roles,
    },
    theirCopastor: {
      id: preacher?.theirCopastor?.id,
      firstName: preacher?.theirCopastor?.member?.firstName,
      lastName: preacher?.theirCopastor?.member?.lastName,
      roles: preacher?.theirCopastor?.member?.roles,
    },
    theirSupervisor: {
      id: preacher?.theirSupervisor?.id,
      firstName: preacher?.theirSupervisor?.member?.firstName,
      lastName: preacher?.theirSupervisor?.member?.lastName,
      roles: preacher?.theirSupervisor?.member?.roles,
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
      firstName: disciple?.member?.firstName,
      lastName: disciple?.member?.lastName,
    })),
  }));
};
