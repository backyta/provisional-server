import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingExpense } from '@/modules/offering/expense/entities';

interface Options {
  offeringExpenses: OfferingExpense[];
}

interface Church {
  id: string;
  abbreviatedChurchName: string;
}

export interface OfferingExpenseAdjustmentData {
  date: string;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  church: Church;
  allOfferings: Array<{
    offering: number;
    currency: string;
    date: Date;
  }>;
}

export const offeringExpensesAdjustmentFormatter = ({
  offeringExpenses,
}: Options): OfferingExpenseAdjustmentData[] => {
  const resultData: OfferingExpenseAdjustmentData[] = offeringExpenses?.reduce(
    (acc, offering) => {
      const existing = acc.find((item) => item.date === offering.date);

      if (existing) {
        if (offering.currency === CurrencyType.PEN) {
          existing.accumulatedOfferingPEN += +offering.amount;
        } else if (offering.currency === CurrencyType.USD) {
          existing.accumulatedOfferingUSD += +offering.amount;
        } else if (offering.currency === CurrencyType.EUR) {
          existing.accumulatedOfferingEUR += +offering.amount;
        }
        existing.allOfferings.push({
          offering: +offering?.amount,
          currency: offering?.currency,
          date: offering?.date,
        });
      } else {
        acc.push({
          date: offering?.date,
          accumulatedOfferingPEN:
            offering.currency === CurrencyType.PEN ? +offering.amount : 0,
          accumulatedOfferingUSD:
            offering.currency === CurrencyType.USD ? +offering.amount : 0,
          accumulatedOfferingEUR:
            offering.currency === CurrencyType.EUR ? +offering.amount : 0,
          church: {
            id: offering?.church?.id,
            abbreviatedChurchName: offering?.church?.abbreviatedChurchName,
          },
          allOfferings: [
            {
              offering: +offering?.amount,
              currency: offering?.currency,
              date: offering?.date,
            },
          ],
        });
      }

      return acc;
    },
    [],
  );

  return resultData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
};