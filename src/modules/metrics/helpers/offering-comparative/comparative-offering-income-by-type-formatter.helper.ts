import { CurrencyType } from '@/modules/offering/shared/enums';

import { OfferingIncome } from '@/modules/offering/income/entities';

import {
  OfferingIncomeCreationTypeNames,
  OfferingIncomeCreationSubTypeNames,
} from '@/modules/offering/income/enums';

interface Options {
  offeringIncome: OfferingIncome[];
}

interface ResultDataOptions {
  month: string;
  type: string;
  subType: string | null;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  church: {
    id: string;
    churchName: string;
  };
  totalAmount: number;
}

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const comparativeOfferingIncomeByTypeFormatter = ({
  offeringIncome,
}: Options) => {
  const resultData: ResultDataOptions[] = offeringIncome?.reduce<
    ResultDataOptions[]
  >((acc, offering) => {
    const offeringDate = new Date(offering.date);
    const offeringMonth = offeringDate.getMonth();

    const existing = acc.find(
      (item) => item?.month === monthNames[new Date(offering.date).getMonth()],
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
    } else {
      acc.push({
        month: monthNames[offeringMonth],
        type: OfferingIncomeCreationTypeNames[offering?.type],
        subType:
          OfferingIncomeCreationSubTypeNames[offering.subType] ??
          'Ajuste por Ingreso',
        accumulatedOfferingPEN:
          offering?.currency === CurrencyType.PEN ? +offering?.amount : 0,
        accumulatedOfferingUSD:
          offering?.currency === CurrencyType.USD ? +offering?.amount : 0,
        accumulatedOfferingEUR:
          offering?.currency === CurrencyType.EUR ? +offering?.amount : 0,
        church: {
          id:
            offering?.church?.id ??
            offering?.pastor?.theirChurch?.id ??
            offering?.copastor?.theirChurch?.id ??
            offering?.supervisor?.theirChurch?.id ??
            offering?.preacher?.theirChurch?.id ??
            offering?.disciple?.theirChurch?.id ??
            offering?.familyGroup?.theirChurch?.id ??
            offering?.zone?.theirChurch?.id,
          churchName:
            offering?.church?.churchName ??
            offering?.pastor?.theirChurch?.churchName ??
            offering?.copastor?.theirChurch?.churchName ??
            offering?.supervisor?.theirChurch?.churchName ??
            offering?.preacher?.theirChurch?.churchName ??
            offering?.disciple?.theirChurch?.churchName ??
            offering?.familyGroup?.theirChurch?.churchName ??
            offering?.zone?.theirChurch?.churchName,
        },
        totalAmount: +offering.amount,
      });
    }

    return acc;
  }, []);

  return resultData.sort(
    (a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month),
  );
};
