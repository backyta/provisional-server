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
      abbreviatedChurchName: offeringExpense.church?.abbreviatedChurchName,
      district: offeringExpense.church?.district,
      urbanSector: offeringExpense.church?.urbanSector,
    },
  }));
};
