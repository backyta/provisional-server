import { OfferingExpense } from '@/modules/offering/expense/entities';

interface Options {
  offeringsExpenses: OfferingExpense[];
}

export const formatDataOfferingExpense = ({ offeringsExpenses }: Options) => {
  return offeringsExpenses.map((offeringExpense) => ({
    ...offeringExpense,
    church: {
      id: offeringExpense.church?.id,
      churchName: offeringExpense.church?.churchName,
      department: offeringExpense.church?.department,
      province: offeringExpense.church?.province,
      district: offeringExpense.church?.district,
    },
  }));
};
