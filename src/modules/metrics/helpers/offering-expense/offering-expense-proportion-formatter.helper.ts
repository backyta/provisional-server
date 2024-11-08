import { RecordStatus } from '@/common/enums';
import { OfferingExpense } from '@/modules/offering/expense/entities';

interface Options {
  offeringExpenses: OfferingExpense[];
}

interface OfferingExpenseProportion {
  totalOfferingExpenseRecordsCount: number;
  activeOfferingExpenseRecordsCount: number;
  inactiveOfferingExpenseRecordsCount: number;
}

export const offeringExpenseProportionFormatter = ({
  offeringExpenses,
}: Options): OfferingExpenseProportion => {
  const totalOfferingExpenseRecordsCount = offeringExpenses.length;

  const activeOfferingExpenseRecordsCount = offeringExpenses.filter(
    (offeringExpense) => offeringExpense.recordStatus === RecordStatus.Active,
  ).length;

  const inactiveOfferingExpenseRecordsCount = offeringExpenses.filter(
    (offeringExpense) => offeringExpense.recordStatus === RecordStatus.Inactive,
  ).length;

  return {
    totalOfferingExpenseRecordsCount,
    activeOfferingExpenseRecordsCount,
    inactiveOfferingExpenseRecordsCount,
  };
};
