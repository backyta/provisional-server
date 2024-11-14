import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingExpense } from '@/modules/offering/expense/entities';
import { OfferingExpenseSearchTypeNames } from '@/modules/offering/expense/enums';

interface Options {
  offeringExpenses: OfferingExpense[];
}

interface Church {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

interface OfferingExpenseByMonthResult {
  month: string;
  type: string;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  church: Church;
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

export const comparativeOfferingExpensesByTypeFormatter = ({
  offeringExpenses,
}: Options): OfferingExpenseByMonthResult[] => {
  const resultData: OfferingExpenseByMonthResult[] = offeringExpenses?.reduce(
    (acc, offering) => {
      const offeringDate = new Date(offering.date);
      const offeringMonth = offeringDate.getMonth();

      const existing = acc.find(
        (item) =>
          item?.month === monthNames[new Date(offering.date).getMonth()],
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
          type: OfferingExpenseSearchTypeNames[offering?.type],
          accumulatedOfferingPEN:
            offering?.currency === CurrencyType.PEN ? +offering?.amount : 0,
          accumulatedOfferingUSD:
            offering?.currency === CurrencyType.USD ? +offering?.amount : 0,
          accumulatedOfferingEUR:
            offering?.currency === CurrencyType.EUR ? +offering?.amount : 0,
          church: {
            isAnexe: offering?.church?.isAnexe,
            abbreviatedChurchName: offering?.church?.abbreviatedChurchName,
          },
          totalAmount: +offering.amount,
        });
      }

      return acc;
    },
    [],
  );

  return resultData.sort(
    (a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month),
  );
};