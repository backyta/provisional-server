import { OfferingIncome } from '@/modules/offering/income/entities';

interface Options {
  offeringIncome: OfferingIncome[];
}

export const offeringIncomeDataFormatter = ({
  offeringIncome: offeringsIncome,
}: Options) => {
  return offeringsIncome.map((offeringIncome) => ({
    ...offeringIncome,
    church: {
      id: offeringIncome?.church?.id,
      churchName: offeringIncome?.church?.churchName,
      abbreviatedChurchName: offeringIncome?.church?.abbreviatedChurchName,
      department: offeringIncome?.church?.department,
      province: offeringIncome?.church?.province,
      district: offeringIncome?.church?.district,
    },
    pastor: {
      id: offeringIncome?.pastor?.id,
      firstName: offeringIncome?.pastor?.firstName,
      lastName: offeringIncome?.pastor?.lastName,
      roles: offeringIncome?.pastor?.roles,
    },
    copastor: {
      id: offeringIncome?.copastor?.id,
      firstName: offeringIncome?.copastor?.firstName,
      lastName: offeringIncome?.copastor?.lastName,
      roles: offeringIncome?.copastor?.roles,
    },
    supervisor: {
      id: offeringIncome?.supervisor?.id,
      firstName: offeringIncome?.supervisor?.firstName,
      lastName: offeringIncome?.supervisor?.lastName,
      roles: offeringIncome?.supervisor?.roles,
    },
    preacher: {
      id: offeringIncome?.preacher?.id,
      firstName: offeringIncome?.preacher?.firstName,
      lastName: offeringIncome?.preacher?.lastName,
      roles: offeringIncome?.preacher?.roles,
    },
    disciple: {
      id: offeringIncome?.disciple?.id,
      firstName: offeringIncome?.disciple?.firstName,
      lastName: offeringIncome?.disciple?.lastName,
      roles: offeringIncome?.disciple?.roles,
    },
    zone: {
      id: offeringIncome?.zone?.id,
      zoneName: offeringIncome?.zone?.zoneName,
      department: offeringIncome?.zone?.department,
      province: offeringIncome?.zone?.province,
      district: offeringIncome?.zone?.district,
    },
    familyGroup: {
      id: offeringIncome?.familyGroup?.id,
      familyGroupName: offeringIncome?.familyGroup?.familyGroupName,
      familyGroupCode: offeringIncome?.familyGroup?.familyGroupCode,
      district: offeringIncome?.familyGroup?.district,
      urbanSector: offeringIncome?.familyGroup?.urbanSector,
      theirPreacher: offeringIncome?.familyGroup?.theirPreacher,
      disciples: offeringIncome?.familyGroup?.disciples,
    },
  }));
};
