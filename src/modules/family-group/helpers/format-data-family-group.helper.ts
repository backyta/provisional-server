import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

export const formatDataFamilyGroup = ({ familyGroups }: Options) => {
  return familyGroups.map((familyGroup) => ({
    ...familyGroup,
    theirChurch: {
      id: familyGroup.theirChurch?.id,
      churchName: familyGroup.theirChurch?.churchName,
      district: familyGroup.theirChurch?.district,
      urbanSector: familyGroup.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: familyGroup.theirPastor?.id,
      firstName: familyGroup.theirPastor?.firstName,
      lastName: familyGroup.theirPastor?.lastName,
      roles: familyGroup.theirPastor?.roles,
    },
    theirCopastor: {
      id: familyGroup.theirCopastor?.id,
      firstName: familyGroup.theirCopastor?.firstName,
      lastName: familyGroup.theirCopastor?.lastName,
      roles: familyGroup.theirCopastor?.roles,
    },
    theirSupervisor: {
      id: familyGroup.theirSupervisor?.id,
      firstName: familyGroup.theirSupervisor?.firstName,
      lastName: familyGroup.theirSupervisor?.lastName,
      roles: familyGroup.theirSupervisor?.roles,
    },
    theirZone: {
      id: familyGroup.theirZone?.id,
      zoneName: familyGroup.theirZone?.zoneName,
      department: familyGroup.theirZone?.department,
      province: familyGroup.theirZone?.province,
      district: familyGroup.theirZone?.district,
    },
    theirPreacher: {
      id: familyGroup.theirPreacher?.id,
      firstName: familyGroup.theirPreacher?.firstName,
      lastName: familyGroup.theirPreacher?.lastName,
      roles: familyGroup.theirPreacher?.roles,
    },
    disciples: familyGroup.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.firstName,
      lastName: disciple?.lastName,
    })),
  }));
};
