import { RecordStatus } from '@/common/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';

interface Options {
  offeringIncome: OfferingIncome[];
}

interface OfferingIncomeProportion {
  totalOfferingIncomeRecordsCount: number;
  activeOfferingIncomeRecordsCount: number;
  inactiveOfferingIncomeRecordsCount: number;
}

export const offeringIncomeProportionFormatter = ({
  offeringIncome,
}: Options): OfferingIncomeProportion => {
  const totalOfferingIncomeRecordsCount = offeringIncome.length;

  const activeOfferingIncomeRecordsCount = offeringIncome.filter(
    (offering) => offering.recordStatus === RecordStatus.Active,
  ).length;

  const inactiveOfferingIncomeRecordsCount = offeringIncome.filter(
    (offering) => offering.recordStatus === RecordStatus.Inactive,
  ).length;

  return {
    totalOfferingIncomeRecordsCount,
    activeOfferingIncomeRecordsCount,
    inactiveOfferingIncomeRecordsCount,
  };
};
