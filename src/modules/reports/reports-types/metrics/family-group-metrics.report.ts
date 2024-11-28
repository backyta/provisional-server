import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { headerSection, footerSection } from '@/modules/reports/sections';

import { MetricSearchType } from '@/modules/metrics/enums';

import {
  FamilyGroupsByZoneDataResult,
  FamilyGroupsByCodeDataResult,
  FamilyGroupsByDistrictDataResult,
  FamilyGroupsByServiceTimeDataResult,
  FamilyGroupsByRecordStatusDataResult,
  MonthlyFamilyGroupsFluctuationDataResult,
} from '@/modules/metrics/helpers/family-group';
import { FamilyGroupServiceTimeNames } from '@/modules/family-group/enums';

interface ReportOptions {
  title?: string;
  subTitle?: string;
  year: string;
  metricsTypesArray: string[];
  familyGroupsByCodeDataResult: FamilyGroupsByCodeDataResult;
  familyGroupsByZoneDataResult: FamilyGroupsByZoneDataResult;
  familyGroupsByDistrictDataResult: FamilyGroupsByDistrictDataResult;
  familyGroupsByServiceTimeDataResult: FamilyGroupsByServiceTimeDataResult;
  familyGroupsByRecordStatusDataResult: FamilyGroupsByRecordStatusDataResult;
  familyGroupsFluctuationByYearDataResult: MonthlyFamilyGroupsFluctuationDataResult[];
}

function calculatePercentage(part: number, total: number) {
  if (total === 0) return 0;
  return ((part / total) * 100).toFixed(1);
}

export const getFamilyGroupMetricsReport = (
  options: ReportOptions,
): TDocumentDefinitions => {
  const {
    title,
    subTitle,
    year,
    metricsTypesArray,
    familyGroupsByZoneDataResult,
    familyGroupsByCodeDataResult,
    familyGroupsByDistrictDataResult,
    familyGroupsByServiceTimeDataResult,
    familyGroupsByRecordStatusDataResult,
    familyGroupsFluctuationByYearDataResult,
  } = options;

  return {
    pageOrientation: 'landscape',
    header: headerSection({
      title: title,
      subTitle: subTitle,
      yearSearch: year,
    }),
    footer: footerSection,
    pageMargins: [20, 110, 20, 60],
    content: [
      //* FamilyGroupsFluctuationByYear
      metricsTypesArray.includes(MetricSearchType.FamilyGroupsFluctuationByYear)
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
                      text: `Fluctuación de Grupos Familiares por Año`,
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
                widths: ['*', '*', '*', '*', '*'],

                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Año',
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
                      text: 'G. Familiares Nuevos',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'G. Familiares Bajas',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...familyGroupsFluctuationByYearDataResult.map((item) => [
                    item?.church?.abbreviatedChurchName,
                    year,
                    item?.month,
                    item?.newFamilyGroups,
                    item?.inactiveFamilyGroups,
                  ]),
                  ['', '', '', '', ''],
                  ['', '', '', '', ''],
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
                      text: `${familyGroupsFluctuationByYearDataResult.reduce((acc, item) => acc + item?.newFamilyGroups, 0)} G. Familiares`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${familyGroupsFluctuationByYearDataResult.reduce((acc, item) => acc + item?.inactiveFamilyGroups, 0)} G. Familiares`,
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

      //* FamilyGroupsByCode
      metricsTypesArray.includes(MetricSearchType.FamilyGroupsByCode)
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
                      text: `Grupos Familiares por Código`,
                      color: '#1d96d3',
                      fontSize: 19,
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
                widths: [120, 100, '*', '*', '*'],

                body: [
                  [
                    {
                      text: 'Iglesia',
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
                      text: 'M. Varones',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'M. Mujeres',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.values(familyGroupsByCodeDataResult).map(
                    (payload) => [
                      payload?.church?.abbreviatedChurchName,
                      payload?.familyGroupCode,
                      payload?.preacher,
                      `${payload?.men}  (${calculatePercentage(
                        payload?.men,
                        payload?.men + payload?.women,
                      )}%)`,
                      `${payload?.women} (${calculatePercentage(
                        payload?.women,
                        payload?.men + payload?.women,
                      )}%)`,
                    ],
                  ),
                  ['', '', '', '', ''],
                  ['', '', '', '', ''],
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
                      text: `${Object.values(familyGroupsByCodeDataResult).reduce((acc, payload) => acc + payload?.men, 0)} varones (${calculatePercentage(
                        Object.values(familyGroupsByCodeDataResult).reduce(
                          (acc, item) => acc + item?.men,
                          0,
                        ),
                        Object.values(familyGroupsByCodeDataResult).reduce(
                          (acc, item) => acc + item?.men + item.women,
                          0,
                        ),
                      )}%)`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${Object.values(familyGroupsByCodeDataResult).reduce((acc, payload) => acc + payload?.women, 0)} mujeres (${calculatePercentage(
                        Object.values(familyGroupsByCodeDataResult).reduce(
                          (acc, item) => acc + item?.women,
                          0,
                        ),
                        Object.values(familyGroupsByCodeDataResult).reduce(
                          (acc, item) => acc + item?.men + item.women,
                          0,
                        ),
                      )}%)`,
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

      //* FamilyGroupsByZone
      metricsTypesArray.includes(MetricSearchType.FamilyGroupsByZone)
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
                      text: `Grupos Familiares por Zona`,
                      color: '#1d96d3',
                      fontSize: 19,
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
                widths: ['*', '*', '*', '*', '*'],

                body: [
                  [
                    {
                      text: 'Iglesia',
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
                    {
                      text: 'Zona',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. G. Familiares',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(familyGroupsByZoneDataResult).map(
                    ([key, payload]) => [
                      payload?.church?.abbreviatedChurchName,
                      payload?.copastor,
                      payload?.supervisor,
                      key,
                      `${payload?.familyGroupsCount} (${calculatePercentage(
                        payload?.familyGroupsCount,
                        Object.values(familyGroupsByZoneDataResult).reduce(
                          (acc, payload) => acc + payload.familyGroupsCount,
                          0,
                        ),
                      )}%)`,
                    ],
                  ),
                  ['', '', '', '', ''],
                  ['', '', '', '', ''],
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
                      text: `${Object.values(familyGroupsByZoneDataResult).reduce((acc, payload) => acc + payload.familyGroupsCount, 0)} G. Familiares`,
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

      //* FamilyGroupsByDistrict
      metricsTypesArray.includes(MetricSearchType.FamilyGroupsByDistrict)
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
                      text: `Grupos Familiares por Distrito`,
                      color: '#1d96d3',
                      fontSize: 19,
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
                widths: ['*', '*', '*', '*'],

                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Distrito',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Sector Urbano',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. Grupos Familiares',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(familyGroupsByDistrictDataResult).map(
                    ([key, payload]) => [
                      payload?.church?.abbreviatedChurchName,
                      payload?.district,
                      key,
                      `${payload?.familyGroupsCount} (${calculatePercentage(
                        payload?.familyGroupsCount,
                        Object.values(familyGroupsByZoneDataResult).reduce(
                          (acc, payload) => acc + payload.familyGroupsCount,
                          0,
                        ),
                      )}%)`,
                    ],
                  ),
                  ['', '', '', ''],
                  ['', '', '', ''],
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
                      text: `${Object.values(familyGroupsByDistrictDataResult).reduce((acc, payload) => acc + payload.familyGroupsCount, 0)} G. Familiares`,
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

      //* FamilyGroupsByServiceTime
      metricsTypesArray.includes(MetricSearchType.FamilyGroupsByServiceTime)
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
                      text: `Grupos Familiares por Horario de Culto`,
                      color: '#1d96d3',
                      fontSize: 19,
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
                widths: ['*', '*', '*'],

                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Horario de Culto',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. Grupos Familiares',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(familyGroupsByServiceTimeDataResult).map(
                    ([key, payload]) => [
                      payload?.church?.abbreviatedChurchName,
                      `${FamilyGroupServiceTimeNames[key]}`,
                      `${[payload?.serviceTimesCount]} (${calculatePercentage(
                        payload?.serviceTimesCount,
                        Object.values(
                          familyGroupsByServiceTimeDataResult,
                        ).reduce(
                          (acc, payload) => acc + payload.serviceTimesCount,
                          0,
                        ),
                      )}%)`,
                    ],
                  ),
                  ['', '', ''],
                  ['', '', ''],
                  [
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
                      text: `${Object.values(familyGroupsByServiceTimeDataResult).reduce((acc, payload) => acc + payload.serviceTimesCount, 0)} G. Familiares`,
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

      //* FamilyGroupsByRecordStatus
      metricsTypesArray.includes(MetricSearchType.FamilyGroupsByRecordStatus)
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
                      text: `Grupos Familiares por Estado de Registro`,
                      color: '#1d96d3',
                      fontSize: 19,
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
                    {
                      text: 'Zona',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'G. Fam. Activos',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'G. Fam. Inactivos',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(familyGroupsByRecordStatusDataResult).map(
                    ([key, payload]) => [
                      payload?.church?.abbreviatedChurchName,
                      payload?.copastor,
                      payload?.supervisor,
                      key,
                      `${payload?.active} (${calculatePercentage(
                        payload?.active,
                        payload?.active + payload?.inactive,
                      )}%)`,
                      `${payload?.inactive} (${calculatePercentage(
                        payload?.inactive,
                        payload?.active + payload?.inactive,
                      )}%)`,
                    ],
                  ),
                  ['', '', '', '', '', ''],
                  ['', '', '', '', '', ''],
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
                      text: `${Object.values(familyGroupsByRecordStatusDataResult).reduce((acc, payload) => acc + payload?.active, 0)} G. Familiares (${calculatePercentage(
                        Object.values(familyGroupsByCodeDataResult).reduce(
                          (acc, item) => acc + item?.men,
                          0,
                        ),
                        Object.values(
                          familyGroupsByRecordStatusDataResult,
                        ).reduce(
                          (acc, item) => acc + item?.active + item.inactive,
                          0,
                        ),
                      )}%)`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${Object.values(familyGroupsByRecordStatusDataResult).reduce((acc, payload) => acc + payload?.inactive, 0)} G. Familiares (${calculatePercentage(
                        Object.values(
                          familyGroupsByRecordStatusDataResult,
                        ).reduce((acc, item) => acc + item?.inactive, 0),
                        Object.values(
                          familyGroupsByRecordStatusDataResult,
                        ).reduce(
                          (acc, item) => acc + item?.active + item.inactive,
                          0,
                        ),
                      )}%)`,
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
