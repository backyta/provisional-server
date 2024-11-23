import { getInitialFullNames } from '@/common/helpers';
import { CurrencyType } from '@/modules/offering/shared/enums';

import { OfferingIncome } from '@/modules/offering/income/entities';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums';

interface Options {
  offeringIncome: OfferingIncome[];
}

interface Church {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

interface Zone {
  id: string;
  zoneName: string;
  district: string;
  disciples: number;
}

interface Supervisor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface OfferingIncomeByFastingAndVigilDataResult {
  type: string;
  date: Date;
  category: string;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  supervisor: Supervisor | null;
  zone?: Zone | null;
  church: Church;
  allOfferings: {
    offering: number;
    currency: string;
    date: Date;
  }[];
}

export const offeringIncomeByFastingAndVigilFormatter = ({
  offeringIncome,
}: Options): OfferingIncomeByFastingAndVigilDataResult[] => {
  const dataResult: OfferingIncomeByFastingAndVigilDataResult[] =
    offeringIncome?.reduce((acc, offering) => {
      const existing = acc.find(
        (item) => item.date === offering.date && item.type === offering.subType,
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
          category: offering.category,
          type: offering?.subType as OfferingIncomeCreationSubType,
          accumulatedOfferingPEN:
            offering.currency === CurrencyType.PEN ? +offering.amount : 0,
          accumulatedOfferingUSD:
            offering.currency === CurrencyType.USD ? +offering.amount : 0,
          accumulatedOfferingEUR:
            offering.currency === CurrencyType.EUR ? +offering.amount : 0,
          zone: {
            id: offering?.zone?.id,
            zoneName: offering?.zone?.zoneName,
            district: offering?.zone?.district,
            disciples: offering?.zone?.disciples?.length,
          },
          supervisor: {
            id: offering?.zone?.theirSupervisor?.id,
            firstName: getInitialFullNames({
              firstNames:
                offering?.zone?.theirSupervisor?.member?.firstName ?? '',
              lastNames: '',
            }),
            lastName: offering?.zone?.theirSupervisor?.member?.lastName,
          },
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
    }, []);

  return dataResult.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
};
