import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { headerSection, footerSection } from '@/modules/reports/sections';

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

export const getZonesReport = (
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
          widths: [
            'auto',
            'auto',
            'auto',
            50,
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
          ],

          body: [
            [
              {
                text: 'Nombre',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Ubicación',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Disc.',
                style: {
                  bold: true,
                },
              },
              {
                text: 'G. Fam.',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Pred.',
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
                text: 'Pastor',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Co-Pastor',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Supervisor',
                style: {
                  bold: true,
                },
              },
            ],
            ...data.map((item) => [
              item?.zoneName,
              `${item?.country}-${item?.department}-${item?.province}-${item?.district}`,
              item?.disciples.length,
              item?.familyGroups.length,
              item?.preachers.length,
              `${item?.theirChurch?.abbreviatedChurchName}`,
              `${item?.theirPastor?.firstName} ${item?.theirPastor?.lastName}`,
              `${item?.theirCopastor?.firstName} ${item?.theirCopastor?.lastName}`,
              `${item?.theirSupervisor?.firstName} ${item?.theirSupervisor?.lastName}`,
            ]),
            ['', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', ''],
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
          widths: [
            'auto',
            'auto',
            'auto',
            50,
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
          ],
          body: [
            [
              {
                text: `Total de ${description}:`,
                colSpan: 1,
                fontSize: 13,
                bold: true,
                margin: [0, 10, 0, 0],
              },
              {
                text: `${data.length} ${description}.`,
                bold: true,
                fontSize: 13,
                colSpan: 2,
                margin: [0, 10, 0, 0],
              },
              {},
              {},
              {},
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
