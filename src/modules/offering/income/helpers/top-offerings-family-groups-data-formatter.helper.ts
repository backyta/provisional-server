import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';

interface ResultDataOptions {
  date: string | Date;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  familyGroup: {
    id: string;
    familyGroupName: string;
    familyGroupCode: string;
    disciples: number;
  };
  preacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
  allOfferings: {
    offering: number;
    currency: string;
    date: Date;
  }[];
}

interface Options {
  offeringsIncome: OfferingIncome[];
}

export const topOfferingsFamilyGroupsDataFormatter = ({
  offeringsIncome,
}: Options) => {
  const resultData: ResultDataOptions[] = offeringsIncome?.reduce<
    ResultDataOptions[]
  >((acc, offering) => {
    const existing = acc.find(
      (item) => item.familyGroup?.id === offering.familyGroup?.id,
    );

    if (existing) {
      if (offering.currency === CurrencyType.PEN) {
        existing.accumulatedOfferingPEN += +offering.amount;
      } else if (offering.currency === CurrencyType.USD) {
        existing.accumulatedOfferingUSD += +offering.amount;
      } else if (offering.currency === CurrencyType.EUR) {
        existing.accumulatedOfferingEUR += +offering.amount;
      }

      existing.allOfferings.push({
        offering: +offering.amount,
        currency: offering.currency,
        date: offering.date,
      });

      console.log(existing.allOfferings);
    } else {
      acc.push({
        date: offering.date,
        accumulatedOfferingPEN:
          offering.currency === CurrencyType.PEN ? +offering.amount : 0,
        accumulatedOfferingUSD:
          offering.currency === CurrencyType.USD ? +offering.amount : 0,
        accumulatedOfferingEUR:
          offering.currency === CurrencyType.EUR ? +offering.amount : 0,
        familyGroup: {
          id: offering?.familyGroup?.id,
          familyGroupName: offering?.familyGroup?.familyGroupName,
          familyGroupCode: offering?.familyGroup?.familyGroupCode,
          disciples: offering?.familyGroup?.disciples?.length,
        },
        preacher: {
          id: offering?.familyGroup?.theirPreacher?.id,
          firstName: offering?.familyGroup?.theirPreacher?.firstName,
          lastName: offering?.familyGroup?.theirPreacher?.lastName,
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

  const top10ResultData = resultData
    .sort(
      (a, b) =>
        b.accumulatedOfferingPEN +
        b.accumulatedOfferingUSD +
        b.accumulatedOfferingEUR -
        (a.accumulatedOfferingPEN +
          a.accumulatedOfferingUSD +
          a.accumulatedOfferingEUR),
    )
    .slice(0, 10);

  return top10ResultData;
};
