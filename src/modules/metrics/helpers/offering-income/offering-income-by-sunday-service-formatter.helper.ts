import { compareAsc, parse } from 'date-fns';

import { dateFormatterToDDMMYY } from '@/common/helpers';

import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';

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
  church: {
    isAnexe: boolean;
    churchName: string;
  };
}

export const offeringIncomeBySundayServiceFormatter = ({
  offeringIncome,
}: Options) => {
  const resultData: ResultDataOptions[] = offeringIncome.reduce<
    ResultDataOptions[]
  >((acc, offering) => {
    const existingEntry = acc.find((item) => item.date === offering.date);

    const updateValues = (entry: ResultDataOptions) => {
      const isDayShift = offering.shift === 'day';
      switch (offering.currency) {
        case CurrencyType.PEN:
          isDayShift
            ? (entry.dayPEN += +offering.amount)
            : (entry.afternoonPEN += +offering.amount);
          break;
        case CurrencyType.USD:
          isDayShift
            ? (entry.dayUSD += +offering.amount)
            : (entry.afternoonUSD += +offering.amount);
          break;
        case CurrencyType.EUR:
          isDayShift
            ? (entry.dayEUR += +offering.amount)
            : (entry.afternoonEUR += +offering.amount);
          break;
      }
    };

    if (existingEntry) {
      updateValues(existingEntry);
    } else {
      const newEntry: ResultDataOptions = {
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
        church: {
          isAnexe: offering?.church?.isAnexe,
          churchName: offering?.church?.churchName,
        },
      };
      acc.push(newEntry);
    }

    return acc;
  }, []);

  return resultData.sort((a, b) => {
    const dateA = parse(dateFormatterToDDMMYY(a.date), 'dd/MM/yy', new Date());
    const dateB = parse(dateFormatterToDDMMYY(b.date), 'dd/MM/yy', new Date());
    return compareAsc(dateA, dateB);
  });
};
