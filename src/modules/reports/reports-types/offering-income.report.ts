import { addDays, format } from 'date-fns';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import {
  MemberType,
  MemberTypeNames,
  OfferingIncomeCreationTypeNames,
  OfferingIncomeCreationSubTypeNames,
  OfferingIncomeCreationCategoryNames,
  OfferingIncomeCreationShiftTypeNames,
} from '@/modules/offering/income/enums';
import { headerSection, footerSection } from '@/modules/reports/sections';

interface ReportOptions {
  title?: string;
  subTitle?: string;
  description: string;
  searchTerm?: string;
  searchType?: string;
  searchSubType?: string;
  orderSearch?: string;
  data: any;
}

export const getOfferingIncomeReport = (
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
            100,
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            '*',
          ],

          body: [
            [
              {
                text: 'Tipo y sub-tipo',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Categoría',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Turno',
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
                text: 'G. Familiar',
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
                text: 'T. Miembro',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Miembro (N y A)',
                style: {
                  bold: true,
                },
              },
            ],
            ...data.map((item) => [
              item?.subType
                ? `${OfferingIncomeCreationTypeNames[item?.type]} - ${OfferingIncomeCreationSubTypeNames[item?.subType] ?? ''}`
                : `${OfferingIncomeCreationTypeNames[item?.type]} `,
              OfferingIncomeCreationCategoryNames[item?.category] ?? '-',
              OfferingIncomeCreationShiftTypeNames[item?.shift] ?? '-',
              `${item?.amount} ${item?.currency}`,
              format(new Date(addDays(item.date, 1)), 'dd/MM/yyyy'),
              `${item?.church?.abbreviatedChurchName ?? '-'}`,
              `${item?.familyGroup?.familyGroupCode ?? '-'}`,
              `${item?.zone?.zoneName ?? '-'}`,
              `${MemberTypeNames[item?.memberType] ?? '-'}`,
              item?.memberType === MemberType.Pastor
                ? `${item?.pastor?.firstName} ${item?.pastor?.lastName}`
                : item?.memberType === MemberType.Copastor
                  ? `${item?.copastor?.firstName} ${item?.copastor?.lastName}`
                  : item?.memberType === MemberType.Supervisor
                    ? `${item?.supervisor?.firstName} ${item?.supervisor?.lastName}`
                    : item?.memberType === MemberType.Preacher
                      ? `${item?.preacher?.firstName} ${item?.preacher?.lastName}`
                      : item?.memberType === MemberType.Disciple
                        ? `${item?.disciple?.firstName} ${item?.disciple?.lastName}`
                        : '-',
            ]),
            ['', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
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
            100,
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            '*',
          ],
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
