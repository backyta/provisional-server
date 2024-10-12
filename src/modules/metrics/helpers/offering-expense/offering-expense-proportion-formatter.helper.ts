import { RecordStatus } from '@/common/enums';
import { OfferingExpense } from '@/modules/offering/expense/entities';

interface Options {
  offeringExpenses: OfferingExpense[];
}

export const offeringExpenseProportionFormatter = ({
  offeringExpenses,
}: Options) => {
  const totalCountOfferingExpenses = offeringExpenses.length;

  const countOfferingExpensesActive = offeringExpenses.filter(
    (offeringExpense) => offeringExpense.recordStatus === RecordStatus.Active,
  ).length;

  const countOfferingExpensesInactive = offeringExpenses.filter(
    (offeringExpense) => offeringExpense.recordStatus === RecordStatus.Inactive,
  ).length;

  return {
    totalCountOfferingExpenses: totalCountOfferingExpenses,
    countOfferingExpensesActive: countOfferingExpensesActive,
    countOfferingExpensesInactive: countOfferingExpensesInactive,
  };
};
