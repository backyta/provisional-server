import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { headerSection, footerSection } from '@/modules/reports/sections';

import {
  MonthlyMemberResultData,
  MembersByZoneResultData,
  PreachersByZoneResultData,
  MembersByCategoryResultData,
  MemberByRoleAndGenderResultData,
  MembersByRecordStatusResultData,
  MembersByMaritalStatusResultData,
  MonthlyMemberFluctuationResultData,
  MembersByCategoryAndGenderResultData,
  MembersByDistrictAndGenderResultData,
} from '@/modules/metrics/helpers/member';
import { MetricSearchType } from '@/modules/metrics/enums';
import { Church } from '@/modules/church/entities';

interface ReportOptions {
  title?: string;
  subTitle?: string;
  year: string;
  church: Church;
  metricsTypesArray: string[];
  membersByBirthMonthResultData: MonthlyMemberResultData[];
  membersByCategoryResultData: MembersByCategoryResultData;
  membersByZoneAndGenderResultData: MembersByZoneResultData;
  preachersByZoneAndGenderResultData: PreachersByZoneResultData;
  membersByRecordStatusResultData: MembersByRecordStatusResultData;
  membersByRoleAndGenderResultData: MemberByRoleAndGenderResultData;
  membersByMaritalStatusResultData: MembersByMaritalStatusResultData;
  membersFluctuationByYearResultData: MonthlyMemberFluctuationResultData[];
  membersByCategoryAndGenderResultData: MembersByCategoryAndGenderResultData;
  membersByDistrictAndGenderResultData: MembersByDistrictAndGenderResultData;
}

function calculatePercentage(part: number, total: number) {
  if (total === 0) return 0;
  return ((part / total) * 100).toFixed(1);
}

export const getMemberMetricsReport = (
  options: ReportOptions,
): TDocumentDefinitions => {
  const {
    title,
    subTitle,
    year,
    church,
    metricsTypesArray,
    membersByCategoryResultData,
    membersByBirthMonthResultData,
    membersByRecordStatusResultData,
    membersByRoleAndGenderResultData,
    membersByZoneAndGenderResultData,
    membersByMaritalStatusResultData,
    membersFluctuationByYearResultData,
    preachersByZoneAndGenderResultData,
    membersByCategoryAndGenderResultData,
    membersByDistrictAndGenderResultData,
  } = options;

  return {
    pageOrientation: 'landscape',
    header: headerSection({
      title: title,
      subTitle: subTitle,
      yearSearch: year,
      startMonthSearch: '',
    }),
    footer: footerSection,
    pageMargins: [20, 110, 20, 60],
    content: [
      //* MembersFluctuationByYear
      metricsTypesArray.includes(MetricSearchType.MembersFluctuationByYear)
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
                      text: `Fluctuación de Miembros por Año`,
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
                      text: 'Miembros Nuevos',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Miembros Bajas',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...membersFluctuationByYearResultData.map((item) => [
                    item?.church?.abbreviatedChurchName,
                    year,
                    item?.month,
                    item?.newMembers,
                    item?.inactiveMembers,
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
                      text: `${membersFluctuationByYearResultData.reduce((acc, item) => acc + item?.newMembers, 0)} miembros`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${membersFluctuationByYearResultData.reduce((acc, item) => acc + item?.inactiveMembers, 0)} miembros`,
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

      //* MembersByBirthMonth
      metricsTypesArray.includes(MetricSearchType.MembersByBirthMonth)
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
                      text: `Miembros por Mes de Nacimiento`,
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
                      text: 'Mes',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Número de Miembros',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Edad Promedio',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...membersByBirthMonthResultData.map((item) => [
                    item?.church?.abbreviatedChurchName,
                    `${item?.month}`,
                    `${item?.membersCount} (${calculatePercentage(
                      item?.membersCount,
                      membersByBirthMonthResultData.reduce(
                        (acc, item) => acc + item?.membersCount,
                        0,
                      ),
                    )}%)`,
                    `${item?.averageAge} años`,
                  ]),
                  ['', '', '', ''],
                  ['', '', '', ''],
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
                      text: `${membersByBirthMonthResultData.reduce((acc, item) => acc + item?.membersCount, 0)} miembros`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${(membersByBirthMonthResultData.reduce((acc, item) => acc + +item?.averageAge, 0) / membersByBirthMonthResultData.length).toFixed(2)} años`,
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

      //* MembersByCategory
      metricsTypesArray.includes(MetricSearchType.MembersByCategory)
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
                      text: `Miembros por Categoría`,
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
                      text: 'Categoría',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Rango de edad',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Número de Miembros',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(membersByCategoryResultData).map(
                    ([key, value]) => [
                      church?.abbreviatedChurchName,
                      key === 'child'
                        ? `Niños`
                        : key === 'teenager'
                          ? `Adolescente`
                          : key === 'youth'
                            ? `Jóvenes`
                            : key === 'adult'
                              ? `Adultos`
                              : key === 'middleAged'
                                ? `Adulto Mayor`
                                : `Ancianos`,

                      key === 'child'
                        ? `0-12 años`
                        : key === 'teenager'
                          ? '13-17 años'
                          : key === 'youth'
                            ? '18-29 años'
                            : key === 'adult'
                              ? '30-59 años'
                              : key === 'middleAged'
                                ? '60-74 años'
                                : '+75 años',
                      `${value} (${calculatePercentage(
                        value,
                        Object.values(membersByCategoryResultData).reduce(
                          (acc, item) => acc + item,
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
                      text: `${Object.values(membersByCategoryResultData).reduce((acc, item) => acc + item, 0)} miembros`,
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

      //* MembersByCategoryAndGender
      metricsTypesArray.includes(MetricSearchType.MembersByCategoryAndGender)
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
                      text: `Miembros por Categoría y Género`,
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
                      text: 'Categoría',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Rango de edad',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. Miembros Varones',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. Miembros Mujeres',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(membersByCategoryAndGenderResultData).map(
                    ([key, value]) => [
                      church?.abbreviatedChurchName,
                      key === 'child'
                        ? `Niños (${calculatePercentage(
                            value.men + value.women,
                            Object.values(
                              membersByCategoryAndGenderResultData,
                            ).reduce(
                              (acc, item) => acc + item?.men + item?.women,
                              0,
                            ),
                          )}%)`
                        : key === 'teenager'
                          ? `Adolescentes (${calculatePercentage(
                              value.men + value.women,
                              Object.values(
                                membersByCategoryAndGenderResultData,
                              ).reduce(
                                (acc, item) => acc + item?.men + item?.women,
                                0,
                              ),
                            )}%)`
                          : key === 'youth'
                            ? `Jóvenes (${calculatePercentage(
                                value.men + value.women,
                                Object.values(
                                  membersByCategoryAndGenderResultData,
                                ).reduce(
                                  (acc, item) => acc + item?.men + item?.women,
                                  0,
                                ),
                              )}%)`
                            : key === 'adult'
                              ? `Adultos (${calculatePercentage(
                                  value.men + value.women,
                                  Object.values(
                                    membersByCategoryAndGenderResultData,
                                  ).reduce(
                                    (acc, item) =>
                                      acc + item?.men + item?.women,
                                    0,
                                  ),
                                )}%)`
                              : key === 'middleAged'
                                ? `Adulto Mayor (${calculatePercentage(
                                    value.men + value.women,
                                    Object.values(
                                      membersByCategoryAndGenderResultData,
                                    ).reduce(
                                      (acc, item) =>
                                        acc + item?.men + item?.women,
                                      0,
                                    ),
                                  )}%)`
                                : `Ancianos (${calculatePercentage(
                                    value.men + value.women,
                                    Object.values(
                                      membersByCategoryAndGenderResultData,
                                    ).reduce(
                                      (acc, item) =>
                                        acc + item?.men + item?.women,
                                      0,
                                    ),
                                  )}%)`,

                      key === 'child'
                        ? `0-12 años`
                        : key === 'teenager'
                          ? '13-17 años'
                          : key === 'youth'
                            ? '18-29 años'
                            : key === 'adult'
                              ? '30-59 años'
                              : key === 'middleAged'
                                ? '60-74 años'
                                : '+75 años',

                      `${value?.men} (${calculatePercentage(
                        value.men,
                        value?.men + value?.women,
                      )}%)`,
                      `${value?.women} (${calculatePercentage(
                        value.women,
                        value?.men + value?.women,
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
                      text: `${Object.values(membersByCategoryAndGenderResultData).reduce((acc, item) => acc + item?.men, 0)} varones (${calculatePercentage(
                        Object.values(
                          membersByCategoryAndGenderResultData,
                        ).reduce((acc, item) => acc + item?.men, 0),
                        Object.values(
                          membersByCategoryAndGenderResultData,
                        ).reduce(
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
                      text: `${Object.values(membersByCategoryAndGenderResultData).reduce((acc, item) => acc + item?.women, 0)} mujeres (${calculatePercentage(
                        Object.values(
                          membersByCategoryAndGenderResultData,
                        ).reduce((acc, item) => acc + item?.women, 0),
                        Object.values(
                          membersByCategoryAndGenderResultData,
                        ).reduce(
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

      //* MembersByRoleAndGender
      metricsTypesArray.includes(MetricSearchType.MembersByRoleAndGender)
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
                      text: `Miembros por Roles y Género`,
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
                      text: 'Roles',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. Miembros Varones',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. Miembros Mujeres',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(membersByRoleAndGenderResultData).map(
                    ([key, value]) => [
                      value?.church?.abbreviatedChurchName,
                      key === 'pastor'
                        ? `Pastor (${calculatePercentage(
                            value.men + value.women,
                            Object.values(
                              membersByRoleAndGenderResultData,
                            ).reduce(
                              (acc, item) => acc + item?.men + item?.women,
                              0,
                            ),
                          )}%)`
                        : key === 'copastor'
                          ? `Co-Pastor (${calculatePercentage(
                              value.men + value.women,
                              Object.values(
                                membersByRoleAndGenderResultData,
                              ).reduce(
                                (acc, item) => acc + item?.men + item?.women,
                                0,
                              ),
                            )}%)`
                          : key === 'supervisor'
                            ? `Supervisor (${calculatePercentage(
                                value.men + value.women,
                                Object.values(
                                  membersByRoleAndGenderResultData,
                                ).reduce(
                                  (acc, item) => acc + item?.men + item?.women,
                                  0,
                                ),
                              )}%)`
                            : key === 'preacher'
                              ? `Predicador (${calculatePercentage(
                                  value.men + value.women,
                                  Object.values(
                                    membersByRoleAndGenderResultData,
                                  ).reduce(
                                    (acc, item) =>
                                      acc + item?.men + item?.women,
                                    0,
                                  ),
                                )}%)`
                              : `Discípulo (${calculatePercentage(
                                  value.men + value.women,
                                  Object.values(
                                    membersByRoleAndGenderResultData,
                                  ).reduce(
                                    (acc, item) =>
                                      acc + item?.men + item?.women,
                                    0,
                                  ),
                                )}%)`,
                      `${value?.men} (${calculatePercentage(
                        value.men,
                        value?.men + value?.women,
                      )}%)`,
                      `${value?.women} (${calculatePercentage(
                        value.women,
                        value?.men + value?.women,
                      )}%)`,
                    ],
                  ),
                  ['', '', '', ''],
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
                      text: `${Object.values(membersByRoleAndGenderResultData).reduce((acc, item) => acc + item?.men, 0)} varones (${calculatePercentage(
                        Object.values(membersByRoleAndGenderResultData).reduce(
                          (acc, item) => acc + item?.men,
                          0,
                        ),
                        Object.values(membersByRoleAndGenderResultData).reduce(
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
                      text: `${Object.values(membersByRoleAndGenderResultData).reduce((acc, item) => acc + item?.women, 0)} mujeres (${calculatePercentage(
                        Object.values(membersByRoleAndGenderResultData).reduce(
                          (acc, item) => acc + item?.women,
                          0,
                        ),
                        Object.values(membersByRoleAndGenderResultData).reduce(
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

      //* MembersByMaritalStatus
      metricsTypesArray.includes(MetricSearchType.MembersByMaritalStatus)
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
                      text: `Miembros por Estado Civil`,
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
                      text: 'Estado Civil',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Número de Miembros',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(membersByMaritalStatusResultData).map(
                    ([key, value]) => [
                      church.abbreviatedChurchName,
                      key === 'single'
                        ? `Soltero(a)`
                        : key === 'married'
                          ? `Casado(a)`
                          : key === 'divorced'
                            ? `Divorciado(a)`
                            : key === 'windowed'
                              ? `Viudo(a)`
                              : `Otro(a)`,
                      `${value} (${calculatePercentage(
                        value,
                        Object.values(membersByMaritalStatusResultData).reduce(
                          (acc, item) => acc + item,
                          0,
                        ),
                      )}%)`,
                    ],
                  ),
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
                      text: `${Object.values(membersByMaritalStatusResultData).reduce((acc, item) => acc + item, 0)} miembros`,
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

      //* MembersByZoneAndGender
      metricsTypesArray.includes(MetricSearchType.MembersByZoneAndGender)
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
                      text: `Miembros por Zona y Género`,
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
                widths: [100, '*', '*', 100, '*', '*'],

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
                      text: 'Nro. M. Varones',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. M. Mujeres',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(membersByZoneAndGenderResultData).map(
                    ([key, value]) => [
                      value?.church?.abbreviatedChurchName,
                      value.copastor,
                      value.supervisor,
                      `${key} (${calculatePercentage(
                        value.men + value.women,
                        Object.values(membersByZoneAndGenderResultData).reduce(
                          (acc, item) => acc + item.men + item.women,
                          0,
                        ),
                      )}%)`,
                      `${value.men} (${calculatePercentage(
                        value.men,
                        value.men + value.women,
                      )}%)`,
                      `${value.women} (${calculatePercentage(
                        value.women,
                        value.men + value.women,
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
                      text: `${Object.values(membersByZoneAndGenderResultData).reduce((acc, item) => acc + item.men, 0)} varones (${calculatePercentage(
                        Object.values(membersByZoneAndGenderResultData).reduce(
                          (acc, item) => acc + item?.men,
                          0,
                        ),
                        Object.values(membersByZoneAndGenderResultData).reduce(
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
                      text: `${Object.values(membersByZoneAndGenderResultData).reduce((acc, item) => acc + item.women, 0)} mujeres (${calculatePercentage(
                        Object.values(membersByZoneAndGenderResultData).reduce(
                          (acc, item) => acc + item?.women,
                          0,
                        ),
                        Object.values(membersByZoneAndGenderResultData).reduce(
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

      //* PreachersByZoneAndGender
      metricsTypesArray.includes(MetricSearchType.PreachersByZoneAndGender)
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
                      text: `Predicadores por Zona y Género`,
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
                widths: [100, '*', '*', 100, '*', '*'],

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
                      text: 'Nro. M. Varones',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. M. Mujeres',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(preachersByZoneAndGenderResultData).map(
                    ([key, value]) => [
                      value?.church?.abbreviatedChurchName,
                      value.copastor,
                      value.supervisor,
                      `${key} (${calculatePercentage(
                        value.men + value.women,
                        Object.values(
                          preachersByZoneAndGenderResultData,
                        ).reduce((acc, item) => acc + item.men + item.women, 0),
                      )}%)`,
                      `${value.men} (${calculatePercentage(
                        value.men,
                        value.men + value.women,
                      )}%)`,
                      `${value.women} (${calculatePercentage(
                        value.women,
                        value.men + value.women,
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
                      text: `${Object.values(preachersByZoneAndGenderResultData).reduce((acc, item) => acc + item.men, 0)} varones (${calculatePercentage(
                        Object.values(
                          preachersByZoneAndGenderResultData,
                        ).reduce((acc, item) => acc + item?.men, 0),
                        Object.values(
                          preachersByZoneAndGenderResultData,
                        ).reduce(
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
                      text: `${Object.values(preachersByZoneAndGenderResultData).reduce((acc, item) => acc + item.women, 0)} mujeres (${calculatePercentage(
                        Object.values(
                          preachersByZoneAndGenderResultData,
                        ).reduce((acc, item) => acc + item?.women, 0),
                        Object.values(
                          preachersByZoneAndGenderResultData,
                        ).reduce(
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

      //* MembersByDistrictAndGender
      metricsTypesArray.includes(MetricSearchType.MembersByDistrictAndGender)
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
                      text: `Miembros por Distrito y Género`,
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
                      text: 'Nro. Miembros Varones',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. Miembros Mujeres',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(membersByDistrictAndGenderResultData).map(
                    ([key, value]) => [
                      value?.church?.abbreviatedChurchName,
                      value?.district,
                      `${key} (${calculatePercentage(
                        value.men + value.women,
                        Object.values(
                          membersByDistrictAndGenderResultData,
                        ).reduce(
                          (acc, item) => acc + item?.men + item?.women,
                          0,
                        ),
                      )}%)`,
                      `${value?.men} (${calculatePercentage(
                        value.men,
                        value?.men + value?.women,
                      )}%)`,
                      `${value?.women} (${calculatePercentage(
                        value.women,
                        value?.men + value?.women,
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
                      text: `${Object.values(membersByDistrictAndGenderResultData).reduce((acc, item) => acc + item?.men, 0)} varones (${calculatePercentage(
                        Object.values(
                          membersByDistrictAndGenderResultData,
                        ).reduce((acc, item) => acc + item?.men, 0),
                        Object.values(
                          membersByDistrictAndGenderResultData,
                        ).reduce(
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
                      text: `${Object.values(membersByDistrictAndGenderResultData).reduce((acc, item) => acc + item?.women, 0)} mujeres (${calculatePercentage(
                        Object.values(
                          membersByDistrictAndGenderResultData,
                        ).reduce((acc, item) => acc + item?.women, 0),
                        Object.values(
                          membersByDistrictAndGenderResultData,
                        ).reduce(
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

      //* MembersByRecordStatus
      metricsTypesArray.includes(MetricSearchType.MembersByRecordStatus)
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
                      text: `Miembros por Estado de Registro`,
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
                      text: 'Roles',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. Miembros Activos',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Nro. Miembros Inactivos',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  ...Object.entries(membersByRecordStatusResultData).map(
                    ([key, value]) => [
                      value?.church?.abbreviatedChurchName,
                      key === 'pastor'
                        ? `Pastor (${calculatePercentage(
                            value.active + value.inactive,
                            Object.values(
                              membersByRecordStatusResultData,
                            ).reduce(
                              (acc, item) =>
                                acc + item?.active + item?.inactive,
                              0,
                            ),
                          )}%)`
                        : key === 'copastor'
                          ? `Co-Pastor (${calculatePercentage(
                              value.active + value.inactive,
                              Object.values(
                                membersByRecordStatusResultData,
                              ).reduce(
                                (acc, item) =>
                                  acc + item?.active + item?.inactive,
                                0,
                              ),
                            )}%)`
                          : key === 'supervisor'
                            ? `Supervisor (${calculatePercentage(
                                value.active + value.inactive,
                                Object.values(
                                  membersByRecordStatusResultData,
                                ).reduce(
                                  (acc, item) =>
                                    acc + item?.active + item?.inactive,
                                  0,
                                ),
                              )}%)`
                            : key === 'preacher'
                              ? `Predicador (${calculatePercentage(
                                  value.active + value.inactive,
                                  Object.values(
                                    membersByRecordStatusResultData,
                                  ).reduce(
                                    (acc, item) =>
                                      acc + item?.active + item?.inactive,
                                    0,
                                  ),
                                )}%)`
                              : `Discípulo (${calculatePercentage(
                                  value.active + value.inactive,
                                  Object.values(
                                    membersByRecordStatusResultData,
                                  ).reduce(
                                    (acc, item) =>
                                      acc + item?.active + item?.inactive,
                                    0,
                                  ),
                                )}%)`,
                      `${value?.active} (${calculatePercentage(
                        value.active,
                        value?.active + value?.inactive,
                      )}%)`,
                      `${value?.inactive} (${calculatePercentage(
                        value.inactive,
                        value?.active + value?.inactive,
                      )}%)`,
                    ],
                  ),
                  ['', '', '', ''],
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
                      text: `${Object.values(membersByRecordStatusResultData).reduce((acc, item) => acc + item?.active, 0)} varones (${calculatePercentage(
                        Object.values(membersByRecordStatusResultData).reduce(
                          (acc, item) => acc + item?.active,
                          0,
                        ),
                        Object.values(membersByRecordStatusResultData).reduce(
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
                      text: `${Object.values(membersByRecordStatusResultData).reduce((acc, item) => acc + item?.inactive, 0)} mujeres (${calculatePercentage(
                        Object.values(membersByRecordStatusResultData).reduce(
                          (acc, item) => acc + item?.inactive,
                          0,
                        ),
                        Object.values(membersByRecordStatusResultData).reduce(
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
