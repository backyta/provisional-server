import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingExpense } from '@/modules/offering/expense/entities';
import { OfferingExpenseSearchSubTypeNames } from '@/modules/offering/expense/enums';

interface Options {
  offeringExpenses: OfferingExpense[];
}

interface ResultDataOptions {
  subType: string;
  date: Date;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  church: {
    id: string;
    churchName: string;
  };
  allOfferings: { offering: number; currency: string; date: string | Date }[];
  totalAmount: number;
}

export const offeringExpenseChartFormatter = ({
  offeringExpenses,
}: Options) => {
  const resultData: ResultDataOptions[] = offeringExpenses?.reduce<
    ResultDataOptions[]
  >((acc, offering) => {
    const existing = acc.find(
      (item) =>
        item?.subType === OfferingExpenseSearchSubTypeNames[offering?.subType],
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

      existing.allOfferings.push({
        offering: +offering?.amount,
        currency: offering.currency,
        date: offering.date,
      });
    } else {
      acc.push({
        subType: OfferingExpenseSearchSubTypeNames[offering.subType],
        date: offering.date,
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
        allOfferings: [
          {
            offering: +offering?.amount,
            currency: offering?.currency,
            date: offering?.date,
          },
        ],
        totalAmount: +offering.amount,
      });
    }

    return acc;
  }, []);

  return resultData;
};
