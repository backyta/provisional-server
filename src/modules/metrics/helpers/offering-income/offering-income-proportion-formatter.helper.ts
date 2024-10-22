import { RecordStatus } from '@/common/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';

interface Options {
  offeringIncome: OfferingIncome[];
}

export const offeringIncomeProportionFormatter = ({
  offeringIncome,
}: Options) => {
  const totalOfferingIncomeRecordsCount = offeringIncome.length;

  const activeOfferingIncomeRecordsCount = offeringIncome.filter(
    (offering) => offering.recordStatus === RecordStatus.Active,
  ).length;

  const inactiveOfferingIncomeRecordsCount = offeringIncome.filter(
    (offering) => offering.recordStatus === RecordStatus.Inactive,
  ).length;

  return {
    totalOfferingIncomeRecordsCount: totalOfferingIncomeRecordsCount,
    activeOfferingIncomeRecordsCount: activeOfferingIncomeRecordsCount,
    inactiveOfferingIncomeRecordsCount: inactiveOfferingIncomeRecordsCount,
  };
};
