import { getInitialFullNames } from '@/common/helpers';

import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';

interface Options {
  offeringIncome: OfferingIncome[];
}

interface ResultDataOptions {
  date: Date;
  category: string;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  familyGroup: {
    id: string;
    familyGroupName: string;
    familyGroupCode: string;
  };
  preacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
  church: {
    isAnexe: boolean;
    churchName: string;
  };
  disciples: number;
  allOfferings: { offering: number; currency: string; date: string | Date }[];
}

export const offeringIncomeByFamilyGroupFormatter = ({
  offeringIncome,
}: Options) => {
  const resultData: ResultDataOptions[] = offeringIncome?.reduce<
    ResultDataOptions[]
  >((acc, offering) => {
    const existing = acc.find(
      (item) => item?.familyGroup?.id === offering?.familyGroup?.id,
    );

    if (existing) {
      if (offering?.currency === CurrencyType?.PEN) {
        existing.accumulatedOfferingPEN += +offering.amount;
      } else if (offering.currency === CurrencyType.USD) {
        existing.accumulatedOfferingUSD += +offering.amount;
      } else if (offering.currency === CurrencyType.EUR) {
        existing.accumulatedOfferingEUR += +offering.amount;
      }

      existing.allOfferings.push({
        offering: +offering?.amount,
        currency: offering.currency,
        date: offering.date,
      });
    } else {
      acc.push({
        date: offering.date,
        category: offering.category,
        accumulatedOfferingPEN:
          offering?.currency === CurrencyType.PEN ? +offering?.amount : 0,
        accumulatedOfferingUSD:
          offering?.currency === CurrencyType.USD ? +offering?.amount : 0,
        accumulatedOfferingEUR:
          offering?.currency === CurrencyType.EUR ? +offering?.amount : 0,
        familyGroup: {
          id: offering?.familyGroup?.id,
          familyGroupName: offering?.familyGroup?.familyGroupName,
          familyGroupCode: offering?.familyGroup?.familyGroupCode,
        },
        preacher: {
          id: offering?.familyGroup?.theirPreacher?.id,
          firstName: getInitialFullNames({
            firstNames: offering?.familyGroup?.theirPreacher?.firstName ?? '',
            lastNames: '',
          }),
          lastName: offering?.familyGroup?.theirPreacher?.lastName,
        },
        church: {
          isAnexe: offering?.church?.isAnexe,
          churchName: offering?.church?.churchName,
        },
        disciples: offering?.familyGroup?.disciples?.length,
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

  return resultData;
};
