import { compareAsc, parse } from 'date-fns';

import { dateFormatterToDDMMYY } from '@/common/helpers';

import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';

interface Options {
  offeringsIncome: OfferingIncome[];
}

interface ResultDataOptions {
  date: Date;
  dayPEN: number;
  afternoonPEN: number;
  dayUSD: number;
  afternoonUSD: number;
  dayEUR: number;
  afternoonEUR: number;
}

export const lastSundayOfferingsDataFormatter = ({
  offeringsIncome,
}: Options) => {
  const resultData: ResultDataOptions[] = offeringsIncome?.reduce<
    ResultDataOptions[]
  >((acc, offering) => {
    const existing = acc.find((item) => item.date === offering.date);

    if (existing) {
      if (offering.shift === 'day' && offering.currency === CurrencyType.PEN) {
        existing.dayPEN += +offering.amount;
      } else if (
        offering.shift === 'day' &&
        offering.currency === CurrencyType.USD
      ) {
        existing.dayUSD += +offering.amount;
      } else if (
        offering.shift === 'day' &&
        offering.currency === CurrencyType.EUR
      ) {
        existing.dayEUR += +offering.amount;
      } else if (
        offering.shift === 'afternoon' &&
        offering.currency === CurrencyType.PEN
      ) {
        existing.afternoonPEN += +offering.amount;
      } else if (
        offering.shift === 'afternoon' &&
        offering.currency === CurrencyType.USD
      ) {
        existing.afternoonUSD += +offering.amount;
      } else if (
        offering.shift === 'afternoon' &&
        offering.currency === CurrencyType.EUR
      ) {
        existing.afternoonEUR += +offering.amount;
      }
    } else {
      acc.push({
        date: offering.date,
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
      });
    }

    return acc;
  }, []);

  const resultSorted = resultData.sort((a, b) => {
    const dateA = parse(dateFormatterToDDMMYY(a.date), 'dd/MM/yy', new Date());
    const dateB = parse(dateFormatterToDDMMYY(b.date), 'dd/MM/yy', new Date());
    return compareAsc(dateA, dateB);
  });

  return resultSorted;
};
