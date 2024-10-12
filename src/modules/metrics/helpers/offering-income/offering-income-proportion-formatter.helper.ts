import { RecordStatus } from '@/common/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';

interface Options {
  offeringIncome: OfferingIncome[];
}

export const offeringIncomeProportionFormatter = ({
  offeringIncome,
}: Options) => {
  const totalCountOfferingsIncome = offeringIncome.length;

  const countOfferingIncomeActive = offeringIncome.filter(
    (offering) => offering.recordStatus === RecordStatus.Active,
  ).length;

  const countOfferingsIncomeInactive = offeringIncome.filter(
    (offering) => offering.recordStatus === RecordStatus.Inactive,
  ).length;

  return {
    totalCountOfferingsIncome: totalCountOfferingsIncome,
    countOfferingsIncomeActive: countOfferingIncomeActive,
    countOfferingsIncomeInactive: countOfferingsIncomeInactive,
  };
};
