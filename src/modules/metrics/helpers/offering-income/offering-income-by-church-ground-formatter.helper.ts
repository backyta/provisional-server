import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';
import { getInitialFullNames } from '@/common/helpers';

interface Options {
  offeringIncome: OfferingIncome[];
}

interface ResultDataOptions {
  date: Date;
  memberType: string;
  memberId: string;
  memberFullName: string;
  allOfferings: {
    offering: number;
    currency: string;
    date: Date;
  }[];
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
}

export const offeringIncomeByChurchGroundFormatter = ({
  offeringIncome,
}: Options) => {
  const resultData: ResultDataOptions[] = offeringIncome?.reduce<
    ResultDataOptions[]
  >((acc, offering) => {
    const existing = acc.find(
      (item) =>
        item.memberId === offering?.pastor?.id ||
        item.memberId === offering?.copastor?.id ||
        item.memberId === offering?.supervisor?.id ||
        item.memberId === offering?.preacher?.id ||
        item.memberId === offering?.disciple?.id,
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
        memberType: offering.memberType,
        memberFullName: offering?.pastor
          ? `${getInitialFullNames({ firstNames: offering?.pastor?.firstName ?? '', lastNames: '' })} ${offering?.pastor?.lastName}`
          : offering?.copastor
            ? `${getInitialFullNames({ firstNames: offering?.copastor?.firstName ?? '', lastNames: '' })} ${offering?.copastor?.lastName}`
            : offering?.supervisor
              ? `${getInitialFullNames({ firstNames: offering?.supervisor?.firstName ?? '', lastNames: '' })} ${offering?.supervisor?.lastName}`
              : offering?.preacher
                ? `${getInitialFullNames({ firstNames: offering?.preacher?.firstName ?? '', lastNames: '' })} ${offering?.preacher?.lastName}`
                : `${getInitialFullNames({ firstNames: offering?.disciple?.firstName ?? '', lastNames: '' })} ${offering?.disciple?.lastName}`,
        memberId: offering?.pastor
          ? offering?.pastor?.id
          : offering?.copastor
            ? offering?.copastor?.id
            : offering?.supervisor
              ? offering?.supervisor?.id
              : offering?.preacher
                ? offering?.preacher?.id
                : offering?.disciple?.id,
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
    (a, b) =>
      b.accumulatedOfferingPEN +
      b.accumulatedOfferingUSD +
      b.accumulatedOfferingEUR -
      (a.accumulatedOfferingPEN +
        a.accumulatedOfferingUSD +
        a.accumulatedOfferingEUR),
  );
};
