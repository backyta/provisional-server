import { RecordStatus } from '@/common/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';

interface Options {
  offeringsIncome: OfferingIncome[];
}

export const offeringIncomeProportionFormatter = ({
  offeringsIncome,
}: Options) => {
  const totalCountOfferingsIncome = offeringsIncome.length;

  const countOfferingIncomeActive = offeringsIncome.filter(
    (offeringIncome) => offeringIncome.recordStatus === RecordStatus.Active,
  ).length;

  const countOfferingsIncomeInactive = offeringsIncome.filter(
    (offeringIncome) => offeringIncome.recordStatus === RecordStatus.Inactive,
  ).length;

  return {
    totalCountOfferingsIncome: totalCountOfferingsIncome,
    countOfferingsIncomeActive: countOfferingIncomeActive,
    countOfferingsIncomeInactive: countOfferingsIncomeInactive,
  };
};
