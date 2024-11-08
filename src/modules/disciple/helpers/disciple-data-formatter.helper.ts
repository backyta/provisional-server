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
      firstName: disciple?.theirPastor?.member?.firstName,
      lastName: disciple?.theirPastor?.member?.lastName,
      roles: disciple?.theirPastor?.member?.roles,
    },
    theirCopastor: {
      id: disciple?.theirCopastor?.id,
      firstName: disciple?.theirCopastor?.member?.firstName,
      lastName: disciple?.theirCopastor?.member?.lastName,
      roles: disciple?.theirCopastor?.member?.roles,
    },
    theirSupervisor: {
      id: disciple?.theirSupervisor?.id,
      firstName: disciple?.theirSupervisor?.member?.firstName,
      lastName: disciple?.theirSupervisor?.member?.lastName,
      roles: disciple?.theirSupervisor?.member?.roles,
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
      firstName: disciple?.theirPreacher?.member?.firstName,
      lastName: disciple?.theirPreacher?.member?.lastName,
      roles: disciple?.theirPreacher?.member?.roles,
    },
  }));
};
