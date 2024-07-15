import { Supervisor } from '@/modules/supervisor/entities';

interface Options {
  supervisors: Supervisor[];
}

export const formatDataSupervisor = ({ supervisors }: Options) => {
  return supervisors.map((supervisor) => ({
    ...supervisor,
    theirChurch: {
      id: supervisor.theirChurch?.id,
      churchName: supervisor.theirChurch?.churchName,
      district: supervisor.theirChurch?.district,
      urbanSector: supervisor.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: supervisor.theirPastor?.id,
      firstName: supervisor.theirPastor?.firstName,
      lastName: supervisor.theirPastor?.lastName,
      roles: supervisor.theirPastor?.roles,
    },
    theirCopastor: {
      id: supervisor.theirCopastor?.id,
      firstName: supervisor.theirCopastor?.firstName,
      lastName: supervisor.theirCopastor?.lastName,
      roles: supervisor.theirCopastor?.roles,
    },
    theirZone: {
      id: supervisor.theirZone?.id,
      zoneName: supervisor.theirZone?.zoneName,
      department: supervisor.theirZone?.department,
      province: supervisor.theirZone?.province,
      district: supervisor.theirZone?.district,
    },
    preachers: supervisor?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstName: preacher?.firstName,
      lastName: preacher?.lastName,
    })),
    familyGroups: supervisor?.familyGroups.map((familyGroup) => ({
      id: familyGroup?.id,
      familyGroupName: familyGroup?.familyGroupName,
      zoneName: familyGroup?.zoneName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.district,
      urbanSector: familyGroup?.urbanSector,
    })),
    disciples: supervisor.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.firstName,
      lastName: disciple?.lastName,
    })),
  }));
};
