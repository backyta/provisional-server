import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { headerSection, footerSection } from '@/modules/reports/sections';

import { MetricSearchType } from '@/modules/metrics/enums';

import {
  YearlyIncomeExpenseComparativeDataResult,
  OfferingIncomeComparativeByTypeDataResult,
  GeneralOfferingIncomeComparativeDataResult,
  GeneralOfferingExpensesComparativeDataResult,
  OfferingExpenseComparativeByTypeDataResult,
} from '@/modules/metrics/helpers/offering-comparative';
import { Church } from '@/modules/church/entities';
import { OfferingIncomeCreationTypeNames } from '@/modules/offering/income/enums';

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
  church: Church;
  startMonth: string;
  endMonth: string;
  metricsTypesArray: string[];
  yearlyIncomeExpenseComparisonPenDataResult: YearlyIncomeExpenseComparativeDataResult[];
  yearlyIncomeExpenseComparisonUsdDataResult: YearlyIncomeExpenseComparativeDataResult[];
  yearlyIncomeExpenseComparisonEurDataResult: YearlyIncomeExpenseComparativeDataResult[];
  generalOfferingIncomeComparativeDataResult: GeneralOfferingIncomeComparativeDataResult[];
  offeringIncomeComparativeByFamilyGroupDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeBySundayServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeBySundaySchoolDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByGeneralFastingDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByGeneralVigilDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByZonalVigilDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByZonalFastingDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByYouthServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByUnitedServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeBySpecialOfferingDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByActivitiesDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByChurchGroundDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByIncomeAdjustmentDataResult: OfferingIncomeComparativeByTypeDataResult[];
  generalOfferingExpensesComparativeDataResult: GeneralOfferingExpensesComparativeDataResult[];
  offeringOperationalExpenseComparativeDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeByMaintenanceAndRepairDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeByDecorationDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeByEquipmentAndTechnologyDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeBySuppliesDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeByPlaningEventsDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeByExpenseAdjustmentDataResult: OfferingExpenseComparativeByTypeDataResult[];
}

export const getFinancialBalanceComparativeMetricsReport = (
  options: ReportOptions,
): TDocumentDefinitions => {
  const {
    title,
    subTitle,
    year,
    church,
    startMonth,
    endMonth,
    metricsTypesArray,
    yearlyIncomeExpenseComparisonPenDataResult,
    yearlyIncomeExpenseComparisonUsdDataResult,
    yearlyIncomeExpenseComparisonEurDataResult,
    generalOfferingIncomeComparativeDataResult,
    offeringIncomeComparativeByFamilyGroupDataResult,
    offeringIncomeComparativeBySundayServiceDataResult,
    offeringIncomeComparativeBySundaySchoolDataResult,
    offeringIncomeComparativeByGeneralFastingDataResult,
    offeringIncomeComparativeByGeneralVigilDataResult,
    offeringIncomeComparativeByZonalVigilDataResult,
    offeringIncomeComparativeByZonalFastingDataResult,
    offeringIncomeComparativeByYouthServiceDataResult,
    offeringIncomeComparativeByUnitedServiceDataResult,
    offeringIncomeComparativeBySpecialOfferingDataResult,
    offeringIncomeComparativeByActivitiesDataResult,
    offeringIncomeComparativeByChurchGroundDataResult,
    offeringIncomeComparativeByIncomeAdjustmentDataResult,
    generalOfferingExpensesComparativeDataResult,
    offeringOperationalExpenseComparativeDataResult,
    offeringExpensesComparativeByMaintenanceAndRepairDataResult,
    offeringExpensesComparativeByDecorationDataResult,
    offeringExpensesComparativeByEquipmentAndTechnologyDataResult,
    offeringExpensesComparativeBySuppliesDataResult,
    offeringExpensesComparativeByPlaningEventsDataResult,
    offeringExpensesComparativeByExpenseAdjustmentDataResult,
  } = options;

  console.log(offeringOperationalExpenseComparativeDataResult);

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
      //? IncomeAndExpensesComparativeByYear
      metricsTypesArray.includes(
        MetricSearchType.IncomeAndExpensesComparativeByYear,
      )
        ? [
            //* Sol Peruano PEN
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Comparativa Ingresos vs Egresos`,
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
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Moneda: Sol Peruano (PEN)`,
                      color: '#1d96d3',
                      fontSize: 15,
                      bold: true,
                      italics: true,
                      alignment: 'center',
                      margin: [0, 1, 0, 0],
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
                widths: [100, 100, '*', '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Mes / Año',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: `Saldo (Mes Anterior)`,
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: `Ingresos`,
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                    {
                      text: `Gastos`,
                      style: {
                        color: 'red',
                        bold: true,
                      },
                    },
                    {
                      text: `Diferencia`,
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                  ],
                  ...yearlyIncomeExpenseComparisonPenDataResult
                    .filter(
                      (item) =>
                        Object.values(monthNames).indexOf(item.month) <=
                        Object.values(monthNames).indexOf(monthNames[endMonth]),
                    )
                    .map((item) => [
                      item?.church?.abbreviatedChurchName,
                      `${item?.month} - ${year}`,
                      `${item?.netResultPrevious} ${item?.currency !== 'S/D' ? item?.currency : 'PEN'}`,
                      `${item?.totalIncome} ${item?.currency !== 'S/D' ? item?.currency : 'PEN'}`,
                      `${item?.totalExpenses} ${item?.currency !== 'S/D' ? item?.currency : 'PEN'}`,
                      `${+item?.netResultPrevious + item?.totalIncome - item?.totalExpenses} ${item?.currency !== 'S/D' ? item?.currency : 'PEN'}`,
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
                      text: `${yearlyIncomeExpenseComparisonPenDataResult
                        .filter(
                          (item) =>
                            Object.values(monthNames).indexOf(item.month) <=
                            Object.values(monthNames).indexOf(
                              monthNames[endMonth],
                            ),
                        )
                        .reduce(
                          (acc, offering) => acc + offering?.totalIncome,
                          0,
                        )} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${yearlyIncomeExpenseComparisonPenDataResult
                        .filter(
                          (item) =>
                            Object.values(monthNames).indexOf(item.month) <=
                            Object.values(monthNames).indexOf(
                              monthNames[endMonth],
                            ),
                        )
                        .reduce(
                          (acc, offering) => acc + offering?.totalExpenses,
                          0,
                        )} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${
                        yearlyIncomeExpenseComparisonPenDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .reduce(
                            (acc, offering) => acc + offering?.totalIncome,
                            0,
                          ) -
                        yearlyIncomeExpenseComparisonPenDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .reduce(
                            (acc, offering) => acc + offering?.totalExpenses,
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
                  ],
                ],
              },
            },

            //* Dolar Americano USD
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Comparativa Ingresos vs Egresos`,
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
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Moneda: Dolar Americano (USD)`,
                      color: '#1d96d3',
                      fontSize: 15,
                      bold: true,
                      italics: true,
                      alignment: 'center',
                      margin: [0, 1, 0, 0],
                    },
                  ],
                ],
              },
            },
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [100, 100, '*', '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Mes / Año',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: `Saldo (Mes Anterior)`,
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: `Ingresos`,
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                    {
                      text: `Gastos`,
                      style: {
                        color: 'red',
                        bold: true,
                      },
                    },
                    {
                      text: `Diferencia`,
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                  ],
                  ...yearlyIncomeExpenseComparisonUsdDataResult
                    .filter(
                      (item) =>
                        Object.values(monthNames).indexOf(item.month) <=
                        Object.values(monthNames).indexOf(monthNames[endMonth]),
                    )
                    .map((item) => [
                      item?.church?.abbreviatedChurchName ??
                        church?.abbreviatedChurchName,
                      `${item?.month} - ${year}`,
                      `${item?.netResultPrevious} ${item?.currency !== 'S/D' ? item?.currency : 'USD'}`,
                      `${item?.totalIncome} ${item?.currency !== 'S/D' ? item?.currency : 'USD'}`,
                      `${item?.totalExpenses} ${item?.currency !== 'S/D' ? item?.currency : 'USD'}`,
                      `${+item?.netResultPrevious + item?.totalIncome - item?.totalExpenses} ${item?.currency !== 'S/D' ? item?.currency : 'USD'}`,
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
                      text: `${yearlyIncomeExpenseComparisonUsdDataResult
                        .filter(
                          (item) =>
                            Object.values(monthNames).indexOf(item.month) <=
                            Object.values(monthNames).indexOf(
                              monthNames[endMonth],
                            ),
                        )
                        .reduce(
                          (acc, offering) => acc + offering?.totalIncome,
                          0,
                        )} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${yearlyIncomeExpenseComparisonUsdDataResult
                        .filter(
                          (item) =>
                            Object.values(monthNames).indexOf(item.month) <=
                            Object.values(monthNames).indexOf(
                              monthNames[endMonth],
                            ),
                        )
                        .reduce(
                          (acc, offering) => acc + offering?.totalExpenses,
                          0,
                        )} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${
                        yearlyIncomeExpenseComparisonUsdDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .reduce(
                            (acc, offering) => acc + offering?.totalIncome,
                            0,
                          ) -
                        yearlyIncomeExpenseComparisonUsdDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .reduce(
                            (acc, offering) => acc + offering?.totalExpenses,
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
                  ],
                ],
              },
            },

            //* Euro Europeo EUR
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Comparativa Ingresos vs Egresos`,
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
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Moneda: Euro Europeo (EUR)`,
                      color: '#1d96d3',
                      fontSize: 15,
                      bold: true,
                      italics: true,
                      alignment: 'center',
                      margin: [0, 1, 0, 0],
                    },
                  ],
                ],
              },
            },
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [100, 100, '*', '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Mes / Año',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: `Saldo (Mes Anterior)`,
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: `Ingresos`,
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                    {
                      text: `Gastos`,
                      style: {
                        color: 'red',
                        bold: true,
                      },
                    },
                    {
                      text: `Diferencia`,
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                  ],
                  ...yearlyIncomeExpenseComparisonEurDataResult
                    .filter(
                      (item) =>
                        Object.values(monthNames).indexOf(item.month) <=
                        Object.values(monthNames).indexOf(monthNames[endMonth]),
                    )
                    .map((item) => [
                      item?.church?.abbreviatedChurchName ??
                        church?.abbreviatedChurchName,
                      `${item?.month} - ${year}`,
                      `${item?.netResultPrevious} ${item?.currency !== 'S/D' ? item?.currency : 'EUR'}`,
                      `${item?.totalIncome} ${item?.currency !== 'S/D' ? item?.currency : 'EUR'}`,
                      `${item?.totalExpenses} ${item?.currency !== 'S/D' ? item?.currency : 'EUR'}`,
                      `${+item?.netResultPrevious + item?.totalIncome - item?.totalExpenses} ${item?.currency !== 'S/D' ? item?.currency : 'EUR'}`,
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
                      text: `${yearlyIncomeExpenseComparisonEurDataResult
                        .filter(
                          (item) =>
                            Object.values(monthNames).indexOf(item.month) <=
                            Object.values(monthNames).indexOf(
                              monthNames[endMonth],
                            ),
                        )
                        .reduce(
                          (acc, offering) => acc + offering?.totalIncome,
                          0,
                        )} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${yearlyIncomeExpenseComparisonEurDataResult
                        .filter(
                          (item) =>
                            Object.values(monthNames).indexOf(item.month) <=
                            Object.values(monthNames).indexOf(
                              monthNames[endMonth],
                            ),
                        )
                        .reduce(
                          (acc, offering) => acc + offering?.totalExpenses,
                          0,
                        )} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${
                        yearlyIncomeExpenseComparisonEurDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .reduce(
                            (acc, offering) => acc + offering?.totalIncome,
                            0,
                          ) -
                        yearlyIncomeExpenseComparisonEurDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .reduce(
                            (acc, offering) => acc + offering?.totalExpenses,
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
                  ],
                ],
              },
            },
          ]
        : null,

      //* GeneralComparativeOfferingIncome
      metricsTypesArray.includes(
        MetricSearchType.GeneralComparativeOfferingIncome,
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
                      text: `Comparativa Ingresos de Ofrenda`,
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
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `General - Rango de meses`,
                      color: '#1d96d3',
                      fontSize: 16,
                      italics: true,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -3, 0, 0],
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
                widths: [100, 100, '*', '*', '*', '*', '*'],
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
                      text: `Tipo`,
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: `Sub-Tipo`,
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: `Total Acu. (PEN)`,
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: `Total Acu. (USD)`,
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                    {
                      text: `Total Acu. (EUR)`,
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                  ],
                  ...generalOfferingIncomeComparativeDataResult.map((item) => [
                    item?.church?.abbreviatedChurchName,
                    `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                    item?.type,
                    item?.subType ===
                    OfferingIncomeCreationTypeNames.income_adjustment
                      ? '-'
                      : item?.subType,
                    item?.accumulatedOfferingPEN,
                    item?.accumulatedOfferingUSD,
                    item?.accumulatedOfferingEUR,
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
                      text: `${generalOfferingIncomeComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${generalOfferingIncomeComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${generalOfferingIncomeComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
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

      //? ComparativeOfferingIncomeByType
      metricsTypesArray.includes(
        MetricSearchType.ComparativeOfferingIncomeByType,
      )
        ? [
            //* Sunday Service
            offeringIncomeComparativeBySundayServiceDataResult.length > 0 &&
            offeringIncomeComparativeBySundayServiceDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    margin: [0, 5, 0, 0],
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Culto Dominical`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 4, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeBySundayServiceDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeBySundayServiceDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySundayServiceDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySundayServiceDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Family Group
            offeringIncomeComparativeByFamilyGroupDataResult.length > 0 &&
            offeringIncomeComparativeByFamilyGroupDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Grupo Familiar`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByFamilyGroupDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeByFamilyGroupDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByFamilyGroupDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByFamilyGroupDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Sunday School
            offeringIncomeComparativeBySundaySchoolDataResult.length > 0 &&
            offeringIncomeComparativeBySundaySchoolDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Escuela Dominical`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeBySundaySchoolDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeBySundaySchoolDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySundaySchoolDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySundaySchoolDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Youth Service
            offeringIncomeComparativeByYouthServiceDataResult.length > 0 &&
            offeringIncomeComparativeByYouthServiceDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Culto Jóvenes`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByYouthServiceDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeByYouthServiceDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByYouthServiceDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByYouthServiceDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Church Ground
            offeringIncomeComparativeByChurchGroundDataResult.length > 0 &&
            offeringIncomeComparativeByChurchGroundDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Terreno Iglesia`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByChurchGroundDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeByChurchGroundDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByChurchGroundDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByChurchGroundDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Activities
            offeringIncomeComparativeByActivitiesDataResult.length > 0 &&
            offeringIncomeComparativeByActivitiesDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Actividades`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByActivitiesDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeByActivitiesDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByActivitiesDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByActivitiesDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* General Fasting
            offeringIncomeComparativeByGeneralFastingDataResult.length > 0 &&
            offeringIncomeComparativeByGeneralFastingDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Ayuno General`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByGeneralFastingDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeByGeneralFastingDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByGeneralFastingDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByGeneralFastingDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Zonal Fasting
            offeringIncomeComparativeByZonalFastingDataResult.length > 0 &&
            offeringIncomeComparativeByZonalFastingDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Ayuno Zonal`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByZonalFastingDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeByZonalFastingDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByZonalFastingDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByZonalFastingDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* General Vigil
            offeringIncomeComparativeByGeneralVigilDataResult.length > 0 &&
            offeringIncomeComparativeByGeneralVigilDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Vigilia General`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByGeneralVigilDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeByGeneralVigilDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByGeneralVigilDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByGeneralVigilDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Zonal Vigil
            offeringIncomeComparativeByZonalVigilDataResult.length > 0 &&
            offeringIncomeComparativeByZonalVigilDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Vigilia Zonal`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByZonalVigilDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeByZonalVigilDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByZonalVigilDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByZonalVigilDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* United Service
            offeringIncomeComparativeByUnitedServiceDataResult.length > 0 &&
            offeringIncomeComparativeByUnitedServiceDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Culto Unido`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByUnitedServiceDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeByUnitedServiceDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByUnitedServiceDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByUnitedServiceDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Special Offering
            offeringIncomeComparativeBySpecialOfferingDataResult.length > 0 &&
            offeringIncomeComparativeBySpecialOfferingDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Ofrenda Especial`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeBySpecialOfferingDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeBySpecialOfferingDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySpecialOfferingDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySpecialOfferingDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Income Adjustment
            offeringIncomeComparativeByIncomeAdjustmentDataResult.length > 0 &&
            offeringIncomeComparativeByIncomeAdjustmentDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
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

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: '#1d96d3',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Ajustes (Ingreso)`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 0],
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
                      widths: [100, 80, 100, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByIncomeAdjustmentDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringIncomeComparativeByIncomeAdjustmentDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByIncomeAdjustmentDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByIncomeAdjustmentDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //? GeneralComparativeOfferingExpenses
            metricsTypesArray.includes(
              MetricSearchType.GeneralComparativeOfferingExpenses,
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
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
                          },
                        ],
                      ],
                    },
                  },
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `General - Rango de meses`,
                            color: 'red',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
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
                      widths: [100, 100, '*', '*', '*', '*'],
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
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...generalOfferingExpensesComparativeDataResult.map(
                          (item) => [
                            item?.church?.abbreviatedChurchName,
                            `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                            item?.type,
                            item?.accumulatedOfferingPEN,
                            item?.accumulatedOfferingUSD,
                            item?.accumulatedOfferingEUR,
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
                            text: `${generalOfferingExpensesComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${generalOfferingExpensesComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${generalOfferingExpensesComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0)} EUR`,
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
          ]
        : null,

      //? ComparativeOfferingExpensesByType
      metricsTypesArray.includes(
        MetricSearchType.ComparativeOfferingExpensesByType,
      )
        ? [
            //* Operational Expenses
            offeringOperationalExpenseComparativeDataResult.length > 0 &&
            offeringOperationalExpenseComparativeDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: 'red',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    margin: [0, 5, 0, 0],
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Gastos Operativos`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 4, 0, 0],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringOperationalExpenseComparativeDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringOperationalExpenseComparativeDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOperationalExpenseComparativeDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOperationalExpenseComparativeDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Maintenance and Repair
            offeringExpensesComparativeByMaintenanceAndRepairDataResult.length >
              0 &&
            offeringExpensesComparativeByMaintenanceAndRepairDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: 'red',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    margin: [0, 5, 0, 0],
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Gastos de Mantenimiento y Reparación`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 4, 0, 0],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeByMaintenanceAndRepairDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringExpensesComparativeByMaintenanceAndRepairDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByMaintenanceAndRepairDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByMaintenanceAndRepairDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Decoration
            offeringExpensesComparativeByDecorationDataResult.length > 0 &&
            offeringExpensesComparativeByDecorationDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: 'red',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    margin: [0, 5, 0, 0],
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Gastos de Decoración`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 4, 0, 0],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeByDecorationDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringExpensesComparativeByDecorationDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByDecorationDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByDecorationDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Equipment and Technology
            offeringExpensesComparativeByEquipmentAndTechnologyDataResult.length >
              0 &&
            offeringExpensesComparativeByEquipmentAndTechnologyDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: 'red',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    margin: [0, 5, 0, 0],
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Gastos de Equipamiento y Tecnología`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 4, 0, 0],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeByEquipmentAndTechnologyDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringExpensesComparativeByEquipmentAndTechnologyDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByEquipmentAndTechnologyDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByEquipmentAndTechnologyDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Supplies
            offeringExpensesComparativeBySuppliesDataResult.length > 0 &&
            offeringExpensesComparativeBySuppliesDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: 'red',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    margin: [0, 5, 0, 0],
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Gastos de Suministros`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 4, 0, 0],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeBySuppliesDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringExpensesComparativeBySuppliesDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeBySuppliesDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeBySuppliesDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Planing Events
            offeringExpensesComparativeByPlaningEventsDataResult.length > 0 &&
            offeringExpensesComparativeByPlaningEventsDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: 'red',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    margin: [0, 5, 0, 0],
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Gastos de Plantación de Eventos`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 4, 0, 0],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeByPlaningEventsDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringExpensesComparativeByPlaningEventsDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByPlaningEventsDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByPlaningEventsDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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

            //* Expense Adjustment
            offeringExpensesComparativeByExpenseAdjustmentDataResult.length >
              0 &&
            offeringExpensesComparativeByExpenseAdjustmentDataResult.filter(
              (item) =>
                Object.values(monthNames).indexOf(item.month) <=
                Object.values(monthNames).indexOf(monthNames[endMonth]),
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Detallado - Por mes`,
                            color: 'red',
                            fontSize: 16,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -3, 0, 0],
                          },
                        ],
                      ],
                    },
                  },

                  {
                    layout: 'noBorders',
                    margin: [0, 5, 0, 0],
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Ajustes (Salidas)`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 4, 0, 0],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeByExpenseAdjustmentDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN} PEN`,
                            `${item?.accumulatedOfferingUSD} USD`,
                            `${item?.accumulatedOfferingEUR} EUR`,
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
                            text: `${offeringExpensesComparativeByExpenseAdjustmentDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByExpenseAdjustmentDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByExpenseAdjustmentDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )} EUR`,
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
          ]
        : null,
    ],
  };
};
