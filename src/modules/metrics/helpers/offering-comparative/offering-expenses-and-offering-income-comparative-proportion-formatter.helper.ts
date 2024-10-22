import { RecordStatus } from '@/common/enums';
import { OfferingExpense } from '@/modules/offering/expense/entities';
import { OfferingIncome } from '@/modules/offering/income/entities';

interface Options {
  offeringIncome: OfferingIncome[];
  offeringExpenses: OfferingExpense[];
}

export const offeringExpensesAndOfferingIncomeProportionFormatter = ({
  offeringIncome,
  offeringExpenses,
}: Options) => {
  const totalOfferingRecordsCount =
    offeringExpenses.length + offeringIncome.length;

  const offeringIncomeRecordsCount = offeringIncome.filter(
    (offering) => offering.recordStatus === RecordStatus.Active,
  ).length;

  const offeringExpenseRecordsCount = offeringExpenses.filter(
    (offering) => offering.recordStatus === RecordStatus.Active,
  ).length;

  return {
    totalOfferingRecordsCount: totalOfferingRecordsCount,
    offeringIncomeRecordsCount: offeringIncomeRecordsCount,
    offeringExpenseRecordsCount: offeringExpenseRecordsCount,
  };
};
