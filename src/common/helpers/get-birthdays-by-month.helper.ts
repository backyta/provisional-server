import { Copastor } from '@/modules/copastor/entities';
import { Pastor } from '@/modules/pastor/entities';
import { Supervisor } from '@/modules/supervisor/entities';

interface Options {
  month: string;
  data: Pastor[] | Copastor[] | Supervisor[];
}

export const getBirthdaysByMonth = ({ month, data }: Options) => {
  const monthMap: Record<string, string> = {
    january: '01',
    february: '02',
    march: '03',
    april: '04',
    may: '05',
    june: '06',
    july: '07',
    august: '08',
    september: '09',
    october: '10',
    november: '11',
    december: '12',
  };

  const monthString = monthMap[month.toLowerCase()];

  if (!monthString) {
    throw new Error('Nombre de mes no válido');
  }

  const result = data.filter((person) => {
    const birthMonth = String(person.birthDate).split('-')[1];
    return birthMonth === monthString;
  });

  return result;
};
