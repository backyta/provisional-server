import type { Content } from 'pdfmake/interfaces';
import { DateFormatter } from '@/modules/reports/helpers';
import { RecordOrderNames } from '@/common/enums';

const logo: Content = {
  image: 'src/assets/logo.png',
  width: 85,
  height: 85,
  margin: [20, 15, 0, 20],
};

const currentDate: Content = {
  text: DateFormatter.getDDMMYYYY(new Date()),
  alignment: 'right',
  bold: true,
  margin: [-35, 40, 20, 35],
  width: 150,
};

interface HeaderSectionOptions {
  title?: string;
  subTitle?: string;
  searchTerm?: string;
  searchType?: string;
  searchSubType?: string;
  orderSearch?: string;
  showLogo?: boolean;
  showDate?: boolean;
}

export const headerSection = (options: HeaderSectionOptions): Content => {
  const {
    title,
    subTitle,
    showDate = true,
    showLogo = true,
    searchTerm,
    searchType,
    searchSubType,
    orderSearch,
  } = options;

  const headerLogo: Content = showLogo ? logo : null;
  const headerDate: Content = showDate ? currentDate : null;

  const headerSubtitle: Content = subTitle
    ? {
        text: subTitle,
        alignment: 'center',
        margin: [35, 2, 0, 0],
        style: {
          bold: true,
          fontSize: 16,
        },
      }
    : null;

  const headerTerms: Content = searchTerm
    ? {
        text: `${searchType} / ${searchSubType}\n${searchTerm}`,
        alignment: 'center',
        margin: [35, 2, 0, 0],
        style: {
          color: '#3b9917',
          bold: true,
          fontSize: 11,
        },
      }
    : {
        text: `Tipo de búsqueda: Búsqueda general / Tipo de orden: ${RecordOrderNames[orderSearch]}`,
        alignment: 'center',
        margin: [35, 2, 0, 0],
        style: {
          color: '#3b9917',
          bold: true,
          fontSize: 11,
        },
      };

  const headerTitle: Content = title
    ? {
        stack: [
          {
            text: title,
            alignment: 'center',
            margin: [35, 20, 0, 0],
            style: {
              bold: true,
              fontSize: 22,
            },
          },
          headerSubtitle,
          headerTerms,
        ],
      }
    : null;

  return {
    columns: [headerLogo, headerTitle, headerDate],
  };
};
