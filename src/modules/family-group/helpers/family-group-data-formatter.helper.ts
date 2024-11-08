import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

export const familyGroupDataFormatter = ({ familyGroups }: Options) => {
  return familyGroups.map((familyGroup) => ({
    ...familyGroup,
    theirChurch: {
      id: familyGroup?.theirChurch?.id,
      churchName: familyGroup?.theirChurch?.churchName,
      abbreviatedChurchName: familyGroup?.theirChurch?.abbreviatedChurchName,
      district: familyGroup?.theirChurch?.district,
      urbanSector: familyGroup?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: familyGroup?.theirPastor?.id,
      firstName: familyGroup?.theirPastor?.member?.firstName,
      lastName: familyGroup?.theirPastor?.member?.lastName,
      roles: familyGroup?.theirPastor?.member?.roles,
    },
    theirCopastor: {
      id: familyGroup?.theirCopastor?.id,
      firstName: familyGroup?.theirCopastor?.member?.firstName,
      lastName: familyGroup?.theirCopastor?.member?.lastName,
      roles: familyGroup?.theirCopastor?.member?.roles,
    },
    theirSupervisor: {
      id: familyGroup?.theirSupervisor?.id,
      firstName: familyGroup?.theirSupervisor?.member?.firstName,
      lastName: familyGroup?.theirSupervisor?.member?.lastName,
      roles: familyGroup?.theirSupervisor?.member?.roles,
    },
    theirZone: {
      id: familyGroup?.theirZone?.id,
      zoneName: familyGroup?.theirZone?.zoneName,
      department: familyGroup?.theirZone?.department,
      province: familyGroup?.theirZone?.province,
      district: familyGroup?.theirZone?.district,
    },
    theirPreacher: {
      id: familyGroup?.theirPreacher?.id,
      firstName: familyGroup?.theirPreacher?.member?.firstName,
      lastName: familyGroup?.theirPreacher?.member?.lastName,
      roles: familyGroup?.theirPreacher?.member?.roles,
    },
    disciples: familyGroup?.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.member?.firstName,
      lastName: disciple?.member?.lastName,
    })),
  }));
};
