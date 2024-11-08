export enum OfferingIncomeSearchSubType {
  OfferingByDate = 'offering_by_date',
  OfferingByChurch = 'offering_by_church',
  OfferingByChurchDate = 'offering_by_church_date',

  // Sunday Service, school sunday
  OfferingByShift = 'offering_by_shift',
  OfferingByShiftDate = 'offering_by_shift_date',

  // Family House, Fasting Zonal, Vigil Zonal
  OfferingByZone = 'offering_by_zone',
  OfferingByZoneDate = 'offering_by_zone_date',

  // Offering Family House
  OfferingByGroupCode = 'offering_by_group_code',
  OfferingByGroupCodeDate = 'offering_by_group_code_date',
  OfferingByPreacherNames = 'offering_by_preacher_names',
  OfferingByPreacherFullName = 'offering_by_preacher_full_name',
  OfferingByPreacherLastNames = 'offering_by_preacher_last_names',

  // Offering Ayuno y Vigilia Zonal
  OfferingBySupervisorNames = 'offering_by_supervisor_names',
  OfferingBySupervisorLastNames = 'offering_by_supervisor_last_names',
  OfferingBySupervisorFullName = 'offering_by_supervisor_full_name',

  // Offering Ground Church and Special
  OfferingByContributorNames = 'offering_by_contributor_names',
  OfferingByContributorLastNames = 'offering_by_contributor_last_names',
  OfferingByContributorFullName = 'offering_by_contributor_full_name',
}
