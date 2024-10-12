import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';

interface Options {
  offeringIncome: OfferingIncome[];
}

interface ResultDataOptions {
  date: Date;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  church: {
    id: string;
    churchName: string;
  };
  allOfferings: {
    offering: number;
    currency: string;
    date: Date;
  }[];
}

export const offeringIncomeByActivitiesFormatter = ({
  offeringIncome,
}: Options) => {
  const resultData: ResultDataOptions[] = offeringIncome?.reduce<
    ResultDataOptions[]
  >((acc, offering) => {
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
          churchName: offering?.church?.churchName,
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
  }, []);

  return resultData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
};
