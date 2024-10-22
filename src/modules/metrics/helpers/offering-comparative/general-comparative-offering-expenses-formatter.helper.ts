import { CurrencyType } from '@/modules/offering/shared/enums';

import { OfferingExpense } from '@/modules/offering/expense/entities';

import { OfferingExpenseSearchTypeNames } from '@/modules/offering/expense/enums';

interface Options {
  offeringExpenses: OfferingExpense[];
}

interface ResultDataOptions {
  type: string;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  church: {
    id: string;
    churchName: string;
  };
  totalAmount: number;
}

export const generalComparativeOfferingExpensesFormatter = ({
  offeringExpenses,
}: Options) => {
  const resultData: ResultDataOptions[] = offeringExpenses?.reduce<
    ResultDataOptions[]
  >((acc, offering) => {
    const existing = acc.find(
      (item) => item?.type === OfferingExpenseSearchTypeNames[offering?.type],
    );

    if (existing) {
      if (offering?.currency === CurrencyType?.PEN) {
        existing.accumulatedOfferingPEN += +offering.amount;
      } else if (offering.currency === CurrencyType.USD) {
        existing.accumulatedOfferingUSD += +offering.amount;
      } else if (offering.currency === CurrencyType.EUR) {
        existing.accumulatedOfferingEUR += +offering.amount;
      }

      existing.totalAmount += +offering.amount;
    } else {
      acc.push({
        type: OfferingExpenseSearchTypeNames[offering?.type],
        accumulatedOfferingPEN:
          offering?.currency === CurrencyType.PEN ? +offering?.amount : 0,
        accumulatedOfferingUSD:
          offering?.currency === CurrencyType.USD ? +offering?.amount : 0,
        accumulatedOfferingEUR:
          offering?.currency === CurrencyType.EUR ? +offering?.amount : 0,
        church: {
          id: offering?.church?.id,
          churchName: offering?.church?.churchName,
        },
        totalAmount: +offering.amount,
      });
    }

    return acc;
  }, []);

  return resultData;
};
