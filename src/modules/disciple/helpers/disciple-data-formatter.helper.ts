import { Disciple } from '@/modules/disciple/entities';

interface Options {
  disciples: Disciple[];
}

export const discipleDataFormatter = ({ disciples }: Options) => {
  return disciples.map((disciple) => ({
    ...disciple,
    theirChurch: {
      id: disciple?.theirChurch?.id,
      churchName: disciple?.theirChurch?.churchName,
      abbreviatedChurchName: disciple?.theirChurch?.abbreviatedChurchName,
      district: disciple?.theirChurch?.district,
      urbanSector: disciple?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: disciple?.theirPastor?.id,
      firstName: disciple?.theirPastor?.firstName,
      lastName: disciple?.theirPastor?.lastName,
      roles: disciple?.theirPastor?.roles,
    },
    theirCopastor: {
      id: disciple?.theirCopastor?.id,
      firstName: disciple?.theirCopastor?.firstName,
      lastName: disciple?.theirCopastor?.lastName,
      roles: disciple?.theirCopastor?.roles,
    },
    theirSupervisor: {
      id: disciple?.theirSupervisor?.id,
      firstName: disciple?.theirSupervisor?.firstName,
      lastName: disciple?.theirSupervisor?.lastName,
      roles: disciple?.theirSupervisor?.roles,
    },
    theirZone: {
      id: disciple?.theirZone?.id,
      zoneName: disciple?.theirZone?.zoneName,
      department: disciple?.theirZone?.department,
      province: disciple?.theirZone?.province,
      district: disciple?.theirZone?.district,
    },
    theirFamilyGroup: {
      id: disciple?.theirFamilyGroup?.id,
      familyGroupName: disciple?.theirFamilyGroup?.familyGroupName,
      familyGroupCode: disciple?.theirFamilyGroup?.familyGroupCode,
      district: disciple?.theirFamilyGroup?.district,
      urbanSector: disciple?.theirFamilyGroup?.urbanSector,
    },
    theirPreacher: {
      id: disciple?.theirPreacher?.id,
      firstName: disciple?.theirPreacher?.firstName,
      lastName: disciple?.theirPreacher?.lastName,
      roles: disciple?.theirPreacher?.roles,
    },
  }));
};
