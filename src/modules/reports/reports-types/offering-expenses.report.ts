import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { headerSection, footerSection } from '@/modules/reports/sections';
import { addDays, format } from 'date-fns';
import {
  OfferingExpenseSearchTypeNames,
  OfferingExpenseSearchSubTypeNames,
} from '@/modules/offering/expense/enums';

interface ReportOptions {
  title?: string;
  subTitle?: string;
  description: string;
  searchTerm?: string;
  searchType?: string;
  searchSubType?: string;
  orderSearch?: string;
  data: any[];
}

export const getOfferingExpensesReport = (
  options: ReportOptions,
): TDocumentDefinitions => {
  const {
    title,
    subTitle,
    data,
    description,
    searchTerm,
    searchType,
    searchSubType,
    orderSearch,
  } = options;

  return {
    pageOrientation: 'landscape',
    header: headerSection({
      title: title,
      subTitle: subTitle,
      searchTerm: searchTerm,
      searchType: searchType,
      searchSubType: searchSubType,
      orderSearch: orderSearch,
    }),
    footer: footerSection,
    pageMargins: [20, 110, 20, 60],
    content: [
      {
        layout: 'customLayout01', // optional
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],

          body: [
            [
              {
                text: 'Tipo',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Sub-tipo',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Monto',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Divisa',
                style: {
                  bold: true,
                },
              },
              {
                text: 'F. Deposito',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Iglesia',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Comentarios',
                style: {
                  bold: true,
                },
              },
            ],
            ...data.map((item) => [
              OfferingExpenseSearchTypeNames[item?.type],
              OfferingExpenseSearchSubTypeNames[item?.subType] ?? 'S/N',
              item?.amount ?? '-',
              item?.currency ?? '-',
              format(new Date(addDays(item.date, 1)), 'dd/MM/yyyy'),
              `${item?.church?.abbreviatedChurchName ?? '-'}`,
              item?.comments ?? '-',
            ]),
            ['', '', '', '', '', '', ''],
            ['', '', '', '', '', '', ''],
          ],
        },
      },

      // Total table
      // {
      //   text: 'Totales',
      //   style: {
      //     fontSize: 14,
      //     bold: true,
      //   },
      //   margin: [0, 10, 0, 0],
      // },
      {
        layout: 'noBorders',
        table: {
          headerRows: 1,
          widths: [100, 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              {
                text: `Total de ${description}:`,
                colSpan: 2,
                fontSize: 13,
                bold: true,
                margin: [0, 10, 0, 0],
              },
              {},
              {
                text: `${data.length} ${description}.`,
                bold: true,
                fontSize: 13,
                colSpan: 1,
                margin: [-50, 10, 0, 0],
              },
              {},
              {},
              {},
              {},
            ],
          ],
        },
      },
    ],
  };
};
