import { OfferingIncome } from '@/modules/offering/income/entities';

interface Options {
  offeringIncome: OfferingIncome[];
}

export const offeringIncomeDataFormatter = ({ offeringIncome }: Options) => {
  return offeringIncome.map((offering) => ({
    ...offering,
    church: {
      id: offering?.church?.id,
      churchName: offering?.church?.churchName,
      abbreviatedChurchName: offering?.church?.abbreviatedChurchName,
      department: offering?.church?.department,
      province: offering?.church?.province,
      district: offering?.church?.district,
    },
    pastor: {
      id: offering?.pastor?.id,
      firstName: offering?.pastor?.member?.firstName,
      lastName: offering?.pastor?.member?.lastName,
      roles: offering?.pastor?.member?.roles,
    },
    copastor: {
      id: offering?.copastor?.id,
      firstName: offering?.copastor?.member?.firstName,
      lastName: offering?.copastor?.member?.lastName,
      roles: offering?.copastor?.member?.roles,
    },
    supervisor: {
      id: offering?.supervisor?.id,
      firstName: offering?.supervisor?.member?.firstName,
      lastName: offering?.supervisor?.member?.lastName,
      roles: offering?.supervisor?.member?.roles,
    },
    preacher: {
      id: offering?.preacher?.id,
      firstName: offering?.preacher?.member?.firstName,
      lastName: offering?.preacher?.member?.lastName,
      roles: offering?.preacher?.member?.roles,
    },
    disciple: {
      id: offering?.disciple?.id,
      firstName: offering?.disciple?.member?.firstName,
      lastName: offering?.disciple?.member?.lastName,
      roles: offering?.disciple?.member?.roles,
    },
    zone: {
      id: offering?.zone?.id,
      zoneName: offering?.zone?.zoneName,
      department: offering?.zone?.department,
      province: offering?.zone?.province,
      district: offering?.zone?.district,
    },
    familyGroup: {
      id: offering?.familyGroup?.id,
      familyGroupName: offering?.familyGroup?.familyGroupName,
      familyGroupCode: offering?.familyGroup?.familyGroupCode,
      district: offering?.familyGroup?.district,
      urbanSector: offering?.familyGroup?.urbanSector,
      theirPreacher: offering?.familyGroup?.theirPreacher,
      disciples: offering?.familyGroup?.disciples,
    },
    externalDonor: {
      id: offering?.externalDonor?.id,
      firstName: offering?.externalDonor?.firstName,
      lastName: offering?.externalDonor?.lastName,
      originCountry: offering?.externalDonor?.originCountry,
      residenceCountry: offering?.externalDonor?.residenceCountry,
      residenceCity: offering?.externalDonor?.residenceCity,
    },
  }));
};
