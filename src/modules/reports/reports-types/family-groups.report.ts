import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { ChurchServiceTimeNames } from '@/modules/church/enums';
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

export const getFamilyGroupsReport = (
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
            65,
            'auto',
            60,
            'auto',
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
                text: 'Código',
                style: {
                  bold: true,
                },
              },
              {
                text: 'H. Culto',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Mbs.',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Predicador',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Zona',
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
              {
                text: 'Ubicación',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Dirección',
                style: {
                  bold: true,
                },
              },
            ],
            ...data.map((item) => [
              item?.familyGroupName,
              item?.familyGroupCode,
              ChurchServiceTimeNames[item?.serviceTime],
              item?.disciples.length,
              `${item?.theirPreacher?.firstName} ${item?.theirPreacher?.lastName}`,
              `${item?.theirZone?.zoneName}`,
              `${item?.theirSupervisor?.firstName} ${item?.theirSupervisor?.lastName}`,
              `${item?.province}-${item?.district}-${item?.urbanSector}`,
              `${item?.address} (${item?.referenceAddress})`,
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
            'auto',
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