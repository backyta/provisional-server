import { RecordStatus } from '@/common/enums';
import { FamilyGroup } from '@/modules/family-group/entities';

interface Options {
  familyGroups: FamilyGroup[];
}

export const familyGroupProportionFormatter = ({ familyGroups }: Options) => {
  const totalCountFamilyGroups = familyGroups.length;

  const countFamilyGroupsActive = familyGroups.filter(
    (member) => member.recordStatus === RecordStatus.Active,
  ).length;

  const countFamilyGroupsInactive = familyGroups.filter(
    (member) => member.recordStatus === RecordStatus.Inactive,
  ).length;

  return {
    totalCountFamilyGroups,
    countFamilyGroupsActive,
    countFamilyGroupsInactive,
  };
};
