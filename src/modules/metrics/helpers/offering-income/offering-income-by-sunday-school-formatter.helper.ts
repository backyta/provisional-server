import { compareAsc, parse } from 'date-fns';

import { dateFormatterToDDMMYY, getInitialFullNames } from '@/common/helpers';

import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';
import { OfferingIncomeCreationCategory } from '@/modules/offering/income/enums';

interface Options {
  offeringIncome: OfferingIncome[];
}

interface ResultDataOptions {
  date: Date;
  category: string;
  dayPEN: number;
  afternoonPEN: number;
  dayUSD: number;
  afternoonUSD: number;
  dayEUR: number;
  afternoonEUR: number;
  memberType: string;
  memberId: string;
  memberFullName: string;
  church: {
    isAnexe: boolean;
    churchName: string;
  };
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  allOfferings: {
    offering: number;
    currency: string;
    date: Date;
  }[];
}

export const offeringIncomeBySundaySchoolFormatter = ({
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
      if (offering.shift === 'day') {
        if (offering.currency === CurrencyType.PEN)
          existingEntry.dayPEN += +offering.amount;
        if (offering.currency === CurrencyType.USD)
          existingEntry.dayUSD += +offering.amount;
        if (offering.currency === CurrencyType.EUR)
          existingEntry.dayEUR += +offering.amount;
      } else if (offering.shift === 'afternoon') {
        if (offering.currency === CurrencyType.PEN)
          existingEntry.afternoonPEN += +offering.amount;
        if (offering.currency === CurrencyType.USD)
          existingEntry.afternoonUSD += +offering.amount;
        if (offering.currency === CurrencyType.EUR)
          existingEntry.afternoonEUR += +offering.amount;
      }

      if (offering.category !== OfferingIncomeCreationCategory.OfferingBox) {
        if (offering.currency === CurrencyType.PEN)
          existingEntry.accumulatedOfferingPEN += +offering.amount;
        if (offering.currency === CurrencyType.USD)
          existingEntry.accumulatedOfferingUSD += +offering.amount;
        if (offering.currency === CurrencyType.EUR)
          existingEntry.accumulatedOfferingEUR += +offering.amount;
      }

      existingEntry.allOfferings.push({
        offering: +offering.amount,
        currency: offering.currency,
        date: offering.date,
      });
    } else {
      acc.push({
        date: offering.date,
        category: offering.category,
        dayPEN:
          offering.shift === 'day' && offering.currency === CurrencyType.PEN
            ? +offering.amount
            : 0,
        afternoonPEN:
          offering.shift === 'afternoon' &&
          offering.currency === CurrencyType.PEN
            ? +offering.amount
            : 0,
        dayUSD:
          offering.shift === 'day' && offering.currency === CurrencyType.USD
            ? +offering.amount
            : 0,
        afternoonUSD:
          offering.shift === 'afternoon' &&
          offering.currency === CurrencyType.USD
            ? +offering.amount
            : 0,
        dayEUR:
          offering.shift === 'day' && offering.currency === CurrencyType.EUR
            ? +offering.amount
            : 0,
        afternoonEUR:
          offering.shift === 'afternoon' &&
          offering.currency === CurrencyType.EUR
            ? +offering.amount
            : 0,
        accumulatedOfferingPEN:
          offering.category !== OfferingIncomeCreationCategory.OfferingBox &&
          offering.currency === CurrencyType.PEN
            ? +offering.amount
            : 0,
        accumulatedOfferingUSD:
          offering.category !== OfferingIncomeCreationCategory.OfferingBox &&
          offering.currency === CurrencyType.USD
            ? +offering.amount
            : 0,
        accumulatedOfferingEUR:
          offering.category !== OfferingIncomeCreationCategory.OfferingBox &&
          offering.currency === CurrencyType.EUR
            ? +offering.amount
            : 0,
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
        church: {
          isAnexe: offering?.church?.isAnexe,
          churchName: offering?.church?.churchName,
        },
        allOfferings:
          offering.category !== OfferingIncomeCreationCategory.OfferingBox
            ? [
                {
                  offering: +offering.amount,
                  currency: offering.currency,
                  date: offering.date,
                },
              ]
            : [],
      });
    }

    return acc;
  }, []);

  // Ordenar los resultados por fecha
  const resultSorted = resultData.sort((a, b) => {
    const dateA = parse(dateFormatterToDDMMYY(a.date), 'dd/MM/yy', new Date());
    const dateB = parse(dateFormatterToDDMMYY(b.date), 'dd/MM/yy', new Date());
    return compareAsc(dateA, dateB);
  });

  console.log(resultSorted);

  return resultSorted;
};
