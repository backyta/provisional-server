import { CurrencyType } from '@/modules/offering/shared/enums';
import { OfferingIncome } from '@/modules/offering/income/entities';
import { getInitialFullNames } from '@/common/helpers';
import { OfferingIncomeCreationCategory } from '@/modules/offering/income/enums';

interface Options {
  offeringIncome: OfferingIncome[];
}

interface Church {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

interface ResultDataOptions {
  date: string;
  category: string;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  memberType: string;
  memberFullName: string;
  memberId: string | undefined;
  church: Church;
  allOfferings: Array<{
    offering: number;
    currency: string;
    date: string;
  }>;
}

export const offeringIncomeByChurchGroundFormatter = ({
  offeringIncome,
}: Options): ResultDataOptions[] => {
  const resultData: ResultDataOptions[] = offeringIncome?.reduce(
    (acc, offering) => {
      const existingEntry = acc.find((item) => {
        if (
          offering.category === OfferingIncomeCreationCategory.InternalDonation
        ) {
          return (
            item.category === offering.category &&
            (item.memberId === offering?.pastor?.id ||
              item.memberId === offering?.copastor?.id ||
              item.memberId === offering?.supervisor?.id ||
              item.memberId === offering?.preacher?.id ||
              item.memberId === offering?.disciple?.id)
          );
        }

        return item.category === offering.category;
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
          memberType: offering.memberType,
          memberFullName: offering?.pastor
            ? `${getInitialFullNames({ firstNames: offering?.pastor?.member?.firstName ?? '', lastNames: '' })} ${offering?.pastor?.member?.lastName}`
            : offering?.copastor
              ? `${getInitialFullNames({ firstNames: offering?.copastor?.member?.firstName ?? '', lastNames: '' })} ${offering?.copastor?.member?.lastName}`
              : offering?.supervisor
                ? `${getInitialFullNames({ firstNames: offering?.supervisor?.member?.firstName ?? '', lastNames: '' })} ${offering?.supervisor?.member?.lastName}`
                : offering?.preacher
                  ? `${getInitialFullNames({ firstNames: offering?.preacher?.member?.firstName ?? '', lastNames: '' })} ${offering?.preacher?.member?.lastName}`
                  : offering?.disciple
                    ? `${getInitialFullNames({ firstNames: offering?.disciple?.member?.firstName ?? '', lastNames: '' })} ${offering?.disciple?.member?.lastName}`
                    : offering.category ===
                        OfferingIncomeCreationCategory.ExternalDonation
                      ? 'Donaciones Externas'
                      : 'Actividades',
          memberId: offering?.pastor
            ? offering?.pastor?.id
            : offering?.copastor
              ? offering?.copastor?.id
              : offering?.supervisor
                ? offering?.supervisor?.id
                : offering?.preacher
                  ? offering?.preacher?.id
                  : offering?.disciple?.id,
          church: {
            isAnexe: offering?.church?.isAnexe,
            abbreviatedChurchName: offering?.church?.abbreviatedChurchName,
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
    },
    [],
  );

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
