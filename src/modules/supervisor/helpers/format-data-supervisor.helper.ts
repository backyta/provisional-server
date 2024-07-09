import { Supervisor } from '@/modules/supervisor/entities';

interface Options {
  supervisors: Supervisor[];
}

export const formatDataSupervisor = ({ supervisors }: Options) => {
  return supervisors.map((supervisor) => ({
    ...supervisor,
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
      district: familyGroup?.disciples,
      urbanSector: familyGroup?.urbanSector,
    })),
    disciples: supervisor.disciples.map((disciple) => ({
      id: disciple?.id,
      firstName: disciple?.firstName,
      lastName: disciple?.lastName,
    })),
  }));
};
