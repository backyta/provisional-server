import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';
import { OfferingIncomeCreationCategory } from '@/modules/offering/income/enums';
import { getInitialFullNames } from '@/common/helpers';

interface Options {
  offeringIncome: OfferingIncome[];
}

interface ResultDataOptions {
  date: Date;
  category: string;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  church: {
    isAnexe: boolean;
    churchName: string;
  };
  memberType: string;
  memberId: string;
  memberFullName: string;
  allOfferings: {
    offering: number;
    currency: string;
    date: Date;
  }[];
}

export const offeringIncomeByYouthServiceFormatter = ({
  offeringIncome,
}: Options) => {
  const resultData: ResultDataOptions[] = offeringIncome?.reduce<
    ResultDataOptions[]
  >((acc, offering) => {
    const existingEntry = acc.find((item) => {
      if (
        offering.category === OfferingIncomeCreationCategory.InternalDonation
      ) {
        return (
          item.date === offering.date &&
          item.category === offering.category &&
          (item.memberId === offering?.pastor?.id ||
            item.memberId === offering?.copastor?.id ||
            item.memberId === offering?.supervisor?.id ||
            item.memberId === offering?.preacher?.id ||
            item.memberId === offering?.disciple?.id)
        );
      }

      return item.date === offering.date && item.category === offering.category;
    });

    if (existingEntry) {
      if (offering.currency === CurrencyType.PEN) {
        existingEntry.accumulatedOfferingPEN += +offering.amount;
      } else if (offering.currency === CurrencyType.USD) {
        existingEntry.accumulatedOfferingUSD += +offering.amount;
      } else if (offering.currency === CurrencyType.EUR) {
        existingEntry.accumulatedOfferingEUR += +offering.amount;
      }
      existingEntry.allOfferings.push({
        offering: +offering?.amount,
        currency: offering?.currency,
        date: offering?.date,
      });
    } else {
      acc.push({
        date: offering?.date,
        category: offering?.category,
        accumulatedOfferingPEN:
          offering.currency === CurrencyType.PEN ? +offering.amount : 0,
        accumulatedOfferingUSD:
          offering.currency === CurrencyType.USD ? +offering.amount : 0,
        accumulatedOfferingEUR:
          offering.currency === CurrencyType.EUR ? +offering.amount : 0,
        church: {
          isAnexe: offering?.church?.isAnexe,
          churchName: offering?.church?.churchName,
        },
        memberType:
          offering.category === OfferingIncomeCreationCategory.InternalDonation
            ? offering.memberType
            : null,
        memberFullName: offering?.pastor
          ? `${getInitialFullNames({ firstNames: offering?.pastor?.firstName ?? '', lastNames: '' })} ${offering?.pastor?.lastName}`
          : offering?.copastor
            ? `${getInitialFullNames({ firstNames: offering?.copastor?.firstName ?? '', lastNames: '' })} ${offering?.copastor?.lastName}`
            : offering?.supervisor
              ? `${getInitialFullNames({ firstNames: offering?.supervisor?.firstName ?? '', lastNames: '' })} ${offering?.supervisor?.lastName}`
              : offering?.preacher
                ? `${getInitialFullNames({ firstNames: offering?.preacher?.firstName ?? '', lastNames: '' })} ${offering?.preacher?.lastName}`
                : offering?.disciple
                  ? `${getInitialFullNames({ firstNames: offering?.disciple?.firstName ?? '', lastNames: '' })} ${offering?.disciple?.lastName}`
                  : null,
        memberId: offering?.pastor
          ? offering?.pastor?.id
          : offering?.copastor
            ? offering?.copastor?.id
            : offering?.supervisor
              ? offering?.supervisor?.id
              : offering?.preacher
                ? offering?.preacher?.id
                : offering?.disciple
                  ? offering?.disciple?.id
                  : null,
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
