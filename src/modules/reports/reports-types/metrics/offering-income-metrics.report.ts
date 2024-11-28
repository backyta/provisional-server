import { addDays, format } from 'date-fns';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { headerSection, footerSection } from '@/modules/reports/sections';

import { MetricSearchType } from '@/modules/metrics/enums';

import {
  MemberTypeNames,
  OfferingIncomeCreationCategory,
  OfferingIncomeCreationSubTypeNames,
  OfferingIncomeCreationCategoryNames,
} from '@/modules/offering/income/enums';

import {
  OfferingIncomeByActivitiesDataResult,
  OfferingIncomeByFamilyGroupDataResult,
  OfferingIncomeByChurchGroundDataResult,
  OfferingIncomeByYouthServiceDataResult,
  OfferingIncomeBySundaySchoolDataResult,
  OfferingIncomeBySundayServiceDataResult,
  OfferingIncomeByUnitedServiceDataResult,
  OfferingIncomeBySpecialOfferingDataResult,
  OfferingIncomeByFastingAndVigilDataResult,
  OfferingIncomeByIncomeAdjustmentDataResult,
} from '@/modules/metrics/helpers/offering-income';

const monthNames = {
  january: 'Enero',
  february: 'Febrero',
  march: 'Marzo',
  april: 'Abril',
  may: 'Mayo',
  june: 'Junio',
  july: 'Julio',
  august: 'Agosto',
  september: 'Septiembre',
  october: 'Octubre',
  november: 'Noviembre',
  december: 'Diciembre',
};

interface ReportOptions {
  title?: string;
  subTitle?: string;
  year: string;
  startMonth: string;
  endMonth: string;
  metricsTypesArray: string[];
  offeringIncomeBySundayServiceDataResult: OfferingIncomeBySundayServiceDataResult[];
  offeringIncomeByFamilyGroupDataResult: OfferingIncomeByFamilyGroupDataResult[];
  offeringIncomeBySundaySchoolDataResult: OfferingIncomeBySundaySchoolDataResult[];
  offeringIncomeByUnitedServiceDataResult: OfferingIncomeByUnitedServiceDataResult[];
  offeringIncomeByFastingAndVigilDataResult: OfferingIncomeByFastingAndVigilDataResult[];
  offeringIncomeByYouthServiceDataResult: OfferingIncomeByYouthServiceDataResult[];
  offeringIncomeBySpecialOfferingDataResult: OfferingIncomeBySpecialOfferingDataResult[];
  offeringIncomeByChurchGroundDataResult: OfferingIncomeByChurchGroundDataResult[];
  offeringIncomeByActivitiesDataResult: OfferingIncomeByActivitiesDataResult[];
  offeringIncomeByIncomeAdjustmentDataResult: OfferingIncomeByIncomeAdjustmentDataResult[];
}

export const getOfferingIncomeMetricsReport = (
  options: ReportOptions,
): TDocumentDefinitions => {
  const {
    title,
    subTitle,
    year,
    startMonth,
    endMonth,
    metricsTypesArray,
    offeringIncomeBySundayServiceDataResult,
    offeringIncomeByFamilyGroupDataResult,
    offeringIncomeBySundaySchoolDataResult,
    offeringIncomeByUnitedServiceDataResult,
    offeringIncomeByFastingAndVigilDataResult,
    offeringIncomeByYouthServiceDataResult,
    offeringIncomeBySpecialOfferingDataResult,
    offeringIncomeByChurchGroundDataResult,
    offeringIncomeByActivitiesDataResult,
    offeringIncomeByIncomeAdjustmentDataResult,
  } = options;

  return {
    pageOrientation: 'landscape',
    header: headerSection({
      title: title,
      subTitle: subTitle,
      yearSearch: year,
      startMonthSearch: startMonth,
      endMonthSearch: endMonth,
    }),
    footer: footerSection,
    pageMargins: [20, 110, 20, 60],
    content: [
      //* OfferingIncomeBySundayService
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeBySundayService)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Culto Dominical`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [70, 70, 70, '*', '*', '*', '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha',
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
                      text: 'Turnos(PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Turnos(USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Turnos(EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeBySundayServiceDataResult.map((offering) => [
                    offering?.church?.abbreviatedChurchName,
                    format(addDays(offering?.date, 1), 'dd/MM/yyyy'),
                    OfferingIncomeCreationCategoryNames[offering.category],
                    `Dia: ${offering?.dayPEN} PEN  Tarde: ${offering?.afternoonPEN} PEN`,
                    `${offering?.dayPEN + offering?.afternoonPEN} PEN`,
                    `Dia: ${offering?.dayUSD} USD  Tarde: ${offering?.afternoonUSD} USD`,
                    `${offering?.dayUSD + offering?.afternoonUSD} USD`,
                    `Dia: ${offering?.dayEUR} EUR  Tarde: ${offering?.afternoonEUR} EUR`,
                    `${offering?.dayEUR + offering?.afternoonEUR} USD`,
                  ]),
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySundayServiceDataResult.reduce((acc, offering) => acc + offering?.dayPEN + offering?.afternoonPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    '',
                    {
                      text: `${offeringIncomeBySundayServiceDataResult.reduce((acc, offering) => acc + offering?.dayUSD + offering?.afternoonUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    '',
                    {
                      text: `${offeringIncomeBySundayServiceDataResult.reduce((acc, offering) => acc + offering?.dayEUR + offering?.afternoonEUR, 0)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByFamilyGroup
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByFamilyGroup)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Grupo Familiar`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [70, 70, 70, 70, '*', '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Rango',
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
                      text: 'Código',
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
                      text: 'Total Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByFamilyGroupDataResult.map((offering) => [
                    offering?.church?.abbreviatedChurchName,
                    `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                    OfferingIncomeCreationCategoryNames[offering?.category],
                    offering?.familyGroup?.familyGroupCode,
                    `${offering?.preacher?.firstName} ${offering?.preacher?.lastName}`,
                    offering.accumulatedOfferingPEN,
                    offering.accumulatedOfferingUSD,
                    offering.accumulatedOfferingEUR,
                  ]),
                  ['', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByFamilyGroupDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByFamilyGroupDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByFamilyGroupDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeBySundaySchool
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeBySundaySchool)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Escuela Dominical`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [60, 65, 65, '*', '*', '*', '*', 60, 60, 60],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha o Rango',
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
                      text: 'Miembro',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. x Turno (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. x Turno (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. x Turno (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. o Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. o Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. o Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeBySundaySchoolDataResult.map((offering) => [
                    offering?.church?.abbreviatedChurchName,
                    offering.category ===
                      OfferingIncomeCreationCategory.InternalDonation ||
                    offering.category ===
                      OfferingIncomeCreationCategory.ExternalDonation
                      ? `${monthNames[startMonth]} - ${monthNames[endMonth]}`
                      : format(addDays(offering?.date, 1), 'dd/MM/yyyy'),
                    OfferingIncomeCreationCategoryNames[offering.category],
                    offering?.memberType
                      ? ` ${offering?.memberFullName} (${MemberTypeNames[offering?.memberType]})`
                      : '-',
                    offering?.dayPEN || offering?.afternoonPEN
                      ? `D: ${offering?.dayPEN} PEN\nT: ${offering?.afternoonPEN} PEN\nTot: ${offering?.dayPEN + offering?.afternoonPEN} PEN`
                      : '-',
                    offering?.dayUSD || offering?.afternoonUSD
                      ? `D: ${offering?.dayUSD} USD\nT: ${offering?.afternoonUSD} USD\nTot.: ${offering?.dayUSD + offering?.afternoonUSD} USD`
                      : '-',
                    offering?.dayEUR || offering?.afternoonEUR
                      ? `D: ${offering?.dayEUR} EUR\nT: ${offering?.afternoonEUR} EUR\nTot.: ${offering?.dayEUR + offering?.afternoonEUR} EUR`
                      : '-',
                    offering.accumulatedOfferingPEN
                      ? `${offering.accumulatedOfferingPEN} PEN`
                      : '-',
                    offering.accumulatedOfferingUSD
                      ? `${offering.accumulatedOfferingUSD} USD`
                      : '-',
                    offering.accumulatedOfferingEUR
                      ? `${offering.accumulatedOfferingEUR} EUR`
                      : '-',
                  ]),
                  ['', '', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    {
                      text: 'Sub-Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySundaySchoolDataResult.reduce((acc, offering) => acc + offering?.dayPEN + offering?.afternoonPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySundaySchoolDataResult.reduce((acc, offering) => acc + offering?.dayUSD + offering?.afternoonUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySundaySchoolDataResult.reduce((acc, offering) => acc + offering?.dayEUR + offering?.afternoonEUR, 0)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySundaySchoolDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySundaySchoolDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySundaySchoolDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                  ['', '', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', '', ''],
                  [
                    {
                      text: 'Totales',
                      style: {
                        color: 'red',
                        alignment: 'center',
                        bold: true,
                        fontSize: 13,
                        italics: true,
                      },
                    },
                    {
                      text: `${
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.dayPEN + offering?.afternoonPEN,
                          0,
                        ) +
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.accumulatedOfferingPEN,
                          0,
                        )
                      } PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.dayUSD + offering?.afternoonUSD,
                          0,
                        ) +
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.accumulatedOfferingUSD,
                          0,
                        )
                      } USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.dayEUR + offering?.afternoonEUR,
                          0,
                        ) +
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.accumulatedOfferingEUR,
                          0,
                        )
                      } EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByUnitedService
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByUnitedService)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Culto Unido`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [100, 70, 70, '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha',
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
                      text: 'Total (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByUnitedServiceDataResult.map((offering) => [
                    offering?.church?.abbreviatedChurchName,
                    format(addDays(offering?.date, 1), 'dd/MM/yyyy'),
                    OfferingIncomeCreationCategoryNames[offering.category],
                    `${offering.accumulatedOfferingPEN} PEN`,
                    `${offering.accumulatedOfferingUSD} USD`,
                    `${offering.accumulatedOfferingEUR} EUR`,
                  ]),
                  ['', '', '', '', '', ''],
                  ['', '', '', '', '', ''],
                  [
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByUnitedServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByUnitedServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByUnitedServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByFastingAndVigil
      metricsTypesArray.includes(
        MetricSearchType.OfferingIncomeByFastingAndVigil,
      )
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Ayuno y Vigilia`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [60, 65, 65, 65, '*', 50, '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Tipo',
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
                      text: 'Supervisor',
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
                      text: 'Total (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByFastingAndVigilDataResult.map(
                    (offering) => [
                      offering?.church?.abbreviatedChurchName,
                      format(addDays(offering?.date, 1), 'dd/MM/yyyy'),
                      OfferingIncomeCreationSubTypeNames[offering?.type],
                      OfferingIncomeCreationCategoryNames[offering?.category],
                      offering?.supervisor?.firstName &&
                      offering?.supervisor?.lastName
                        ? `${offering?.supervisor?.firstName} ${offering?.supervisor?.lastName}`
                        : '-',
                      offering.zone.zoneName ? offering?.zone?.zoneName : '-',
                      `${offering.accumulatedOfferingPEN} PEN`,
                      `${offering.accumulatedOfferingUSD} USD`,
                      `${offering.accumulatedOfferingEUR} EUR`,
                    ],
                  ),
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByFastingAndVigilDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByFastingAndVigilDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByFastingAndVigilDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByYouthService
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByYouthService)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Culto de Jóvenes`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [65, 80, 75, 100, '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha o Rango',
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
                      text: 'Miembro',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. o Tot. Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. o Tot. Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. o Tot. Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByYouthServiceDataResult.map((offering) => [
                    offering?.church?.abbreviatedChurchName,
                    offering.category ===
                      OfferingIncomeCreationCategory.InternalDonation ||
                    offering.category ===
                      OfferingIncomeCreationCategory.ExternalDonation
                      ? `${monthNames[startMonth]} - ${monthNames[endMonth]}`
                      : format(addDays(offering?.date, 1), 'dd/MM/yyyy'),
                    OfferingIncomeCreationCategoryNames[offering.category],
                    offering?.memberType
                      ? ` ${offering?.memberFullName} (${MemberTypeNames[offering?.memberType]})`
                      : '-',
                    offering.accumulatedOfferingPEN
                      ? `${offering.accumulatedOfferingPEN} PEN`
                      : '-',
                    offering.accumulatedOfferingUSD
                      ? `${offering.accumulatedOfferingUSD} USD`
                      : '-',
                    offering.accumulatedOfferingEUR
                      ? `${offering.accumulatedOfferingEUR} EUR`
                      : '-',
                  ]),
                  ['', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByYouthServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByYouthServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByYouthServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeBySpecialOffering
      metricsTypesArray.includes(
        MetricSearchType.OfferingIncomeBySpecialOffering,
      )
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Ofrenda Especial`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [65, 65, 65, '*', '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Rango',
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
                      text: 'Miembro',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeBySpecialOfferingDataResult.map(
                    (offering) => [
                      offering?.church?.abbreviatedChurchName,
                      `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                      OfferingIncomeCreationCategoryNames[offering.category],
                      offering?.memberType
                        ? ` ${offering?.memberFullName} (${MemberTypeNames[offering?.memberType]})`
                        : '-',
                      offering.accumulatedOfferingPEN
                        ? `${offering.accumulatedOfferingPEN} PEN`
                        : '-',
                      offering.accumulatedOfferingUSD
                        ? `${offering.accumulatedOfferingUSD} USD`
                        : '-',
                      offering.accumulatedOfferingEUR
                        ? `${offering.accumulatedOfferingEUR} EUR`
                        : '-',
                    ],
                  ),
                  ['', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySpecialOfferingDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySpecialOfferingDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySpecialOfferingDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByChurchGround
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByChurchGround)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Terreno Iglesia`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [65, 80, 65, '*', '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha o Rango',
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
                      text: 'Miembro',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. o Tot. Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. o Tot. Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Tot. o Tot. Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByChurchGroundDataResult.map((offering) => [
                    offering?.church?.abbreviatedChurchName,
                    offering.category ===
                      OfferingIncomeCreationCategory.InternalDonation ||
                    offering.category ===
                      OfferingIncomeCreationCategory.ExternalDonation
                      ? `${monthNames[startMonth]} - ${monthNames[endMonth]}`
                      : format(addDays(offering?.date, 1), 'dd/MM/yyyy'),
                    OfferingIncomeCreationCategoryNames[offering.category],
                    offering?.memberType
                      ? ` ${offering?.memberFullName} (${MemberTypeNames[offering?.memberType]})`
                      : '-',
                    offering.accumulatedOfferingPEN
                      ? `${offering.accumulatedOfferingPEN} PEN`
                      : '-',
                    offering.accumulatedOfferingUSD
                      ? `${offering.accumulatedOfferingUSD} USD`
                      : '-',
                    offering.accumulatedOfferingEUR
                      ? `${offering.accumulatedOfferingEUR} EUR`
                      : '-',
                  ]),
                  ['', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByChurchGroundDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByChurchGroundDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByChurchGroundDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByActivities
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByActivities)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Actividades`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [100, 70, 70, '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha',
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
                      text: 'Total (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByActivitiesDataResult.map((offering) => [
                    offering?.church?.abbreviatedChurchName,
                    format(addDays(offering?.date, 1), 'dd/MM/yyyy'),
                    OfferingIncomeCreationCategoryNames[offering.category],
                    `${offering.accumulatedOfferingPEN} PEN`,
                    `${offering.accumulatedOfferingUSD} USD`,
                    `${offering.accumulatedOfferingEUR} EUR`,
                  ]),
                  ['', '', '', '', '', ''],
                  ['', '', '', '', '', ''],
                  [
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByActivitiesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByActivitiesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByActivitiesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByActivities
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeAdjustment)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ajustes de Ofrenda (Ingreso)`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [100, 70, 120, '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha',
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
                    {
                      text: 'Total Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByIncomeAdjustmentDataResult.map(
                    (offering) => [
                      offering?.church?.abbreviatedChurchName,
                      format(addDays(offering?.date, 1), 'dd/MM/yyyy'),
                      offering.comments,
                      `${offering.accumulatedOfferingPEN} PEN`,
                      `${offering.accumulatedOfferingUSD} USD`,
                      `${offering.accumulatedOfferingEUR} EUR`,
                    ],
                  ),
                  ['', '', '', '', '', ''],
                  ['', '', '', '', '', ''],
                  [
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByIncomeAdjustmentDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByIncomeAdjustmentDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByIncomeAdjustmentDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,
    ],
  };
};
