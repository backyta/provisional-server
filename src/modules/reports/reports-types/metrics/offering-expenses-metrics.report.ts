import { addDays, format } from 'date-fns';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { headerSection, footerSection } from '@/modules/reports/sections';

import { MetricSearchType } from '@/modules/metrics/enums';

import {
  OfferingExpensesAdjustmentDataResult,
  OfferingExpenseDataResult,
} from '@/modules/metrics/helpers/offering-expense';

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
  operationalOfferingExpensesDataResult: OfferingExpenseDataResult[];
  maintenanceAndRepairOfferingExpensesDataResult: OfferingExpenseDataResult[];
  decorationOfferingExpensesDataResult: OfferingExpenseDataResult[];
  equipmentAndTechnologyOfferingExpensesDataResult: OfferingExpenseDataResult[];
  suppliesOfferingExpensesDataResult: OfferingExpenseDataResult[];
  planingEventsOfferingExpensesDataResult: OfferingExpenseDataResult[];
  offeringExpensesAdjustmentsDataResult: OfferingExpensesAdjustmentDataResult[];
}

export const getOfferingExpensesMetricsReport = (
  options: ReportOptions,
): TDocumentDefinitions => {
  const {
    title,
    subTitle,
    year,
    startMonth,
    endMonth,
    metricsTypesArray,
    operationalOfferingExpensesDataResult,
    maintenanceAndRepairOfferingExpensesDataResult,
    decorationOfferingExpensesDataResult,
    equipmentAndTechnologyOfferingExpensesDataResult,
    suppliesOfferingExpensesDataResult,
    planingEventsOfferingExpensesDataResult,
    offeringExpensesAdjustmentsDataResult,
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
      //* OperationalOfferingExpenses
      metricsTypesArray.includes(MetricSearchType.OperationalOfferingExpenses)
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
                      text: `Gastos de Ofrenda Operativos`,
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
                widths: ['*', '*', '*', '*', '*', '*'],
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
                      text: 'Sub-Tipo',
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
                  ...operationalOfferingExpensesDataResult.map((expense) => [
                    expense?.church?.abbreviatedChurchName,
                    `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                    expense.subType,
                    expense.accumulatedOfferingPEN,
                    expense.accumulatedOfferingUSD,
                    expense.accumulatedOfferingEUR,
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
                      text: `${operationalOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${operationalOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${operationalOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
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

      //* MaintenanceAndRepairOfferingExpenses
      metricsTypesArray.includes(
        MetricSearchType.MaintenanceAndRepairOfferingExpenses,
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
                      text: `Gastos de Ofrenda de Mantenimiento y Reparación`,
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
                widths: ['*', '*', '*', '*', '*', '*'],
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
                      text: 'Sub-Tipo',
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
                  ...maintenanceAndRepairOfferingExpensesDataResult.map(
                    (expense) => [
                      expense?.church?.abbreviatedChurchName,
                      `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                      expense.subType,
                      expense.accumulatedOfferingPEN,
                      expense.accumulatedOfferingUSD,
                      expense.accumulatedOfferingEUR,
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
                      text: `${maintenanceAndRepairOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${maintenanceAndRepairOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${maintenanceAndRepairOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
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

      //* DecorationOfferingExpenses
      metricsTypesArray.includes(MetricSearchType.DecorationOfferingExpenses)
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
                      text: `Gastos de Ofrenda de Decoración`,
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
                widths: ['*', '*', '*', '*', '*', '*'],
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
                      text: 'Sub-Tipo',
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
                  ...decorationOfferingExpensesDataResult.map((expense) => [
                    expense?.church?.abbreviatedChurchName,
                    `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                    expense.subType,
                    expense.accumulatedOfferingPEN,
                    expense.accumulatedOfferingUSD,
                    expense.accumulatedOfferingEUR,
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
                      text: `${decorationOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${decorationOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${decorationOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
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

      //* EquipmentAndTechnologyOfferingExpenses
      metricsTypesArray.includes(
        MetricSearchType.EquipmentAndTechnologyOfferingExpenses,
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
                      text: `Gastos de Ofrenda de Equipamiento y Tecnología`,
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
                widths: ['*', '*', '*', '*', '*', '*'],
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
                      text: 'Sub-Tipo',
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
                  ...equipmentAndTechnologyOfferingExpensesDataResult.map(
                    (expense) => [
                      expense?.church?.abbreviatedChurchName,
                      `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                      expense.subType,
                      expense.accumulatedOfferingPEN,
                      expense.accumulatedOfferingUSD,
                      expense.accumulatedOfferingEUR,
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
                      text: `${equipmentAndTechnologyOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${equipmentAndTechnologyOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${equipmentAndTechnologyOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
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

      //* SuppliesOfferingExpenses
      metricsTypesArray.includes(MetricSearchType.SuppliesOfferingExpenses)
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
                      text: `Gastos de Ofrenda de Suministros`,
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
                widths: ['*', '*', '*', '*', '*', '*'],
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
                      text: 'Sub-Tipo',
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
                  ...suppliesOfferingExpensesDataResult.map((expense) => [
                    expense?.church?.abbreviatedChurchName,
                    `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                    expense.subType,
                    expense.accumulatedOfferingPEN,
                    expense.accumulatedOfferingUSD,
                    expense.accumulatedOfferingEUR,
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
                      text: `${suppliesOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${suppliesOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${suppliesOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
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

      //* PlaningEventsOfferingExpenses
      metricsTypesArray.includes(MetricSearchType.PlaningEventsOfferingExpenses)
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
                      text: `Gastos de Ofrenda de Suministros`,
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
                widths: ['*', '*', '*', '*', '*', '*'],
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
                      text: 'Sub-Tipo',
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
                  ...planingEventsOfferingExpensesDataResult.map((expense) => [
                    expense?.church?.abbreviatedChurchName,
                    `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                    expense.subType,
                    expense.accumulatedOfferingPEN,
                    expense.accumulatedOfferingUSD,
                    expense.accumulatedOfferingEUR,
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
                      text: `${planingEventsOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${planingEventsOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${planingEventsOfferingExpensesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
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

      //* OfferingExpensesAdjustment
      metricsTypesArray.includes(MetricSearchType.OfferingExpensesAdjustment)
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
                      text: `Ajustes de Ofrenda (Salida)`,
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
                widths: ['*', '*', '*', '*', '*', '*'],
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
                  ...offeringExpensesAdjustmentsDataResult.map((expense) => [
                    expense?.church?.abbreviatedChurchName,
                    format(addDays(expense?.date, 1), 'dd/MM/yyyy'),
                    expense.comments,
                    `${expense.accumulatedOfferingPEN} PEN`,
                    `${expense.accumulatedOfferingUSD} USD`,
                    `${expense.accumulatedOfferingEUR} EUR`,
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
                      text: `${offeringExpensesAdjustmentsDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringExpensesAdjustmentsDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringExpensesAdjustmentsDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
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
