export enum OfferingIncomeSearchSubType {
  OfferingByDate = 'offering_by_date',
  OfferingByChurch = 'offering_by_church',
  OfferingByChurchDate = 'offering_by_church_date',

  // Sunday Worship, school sunday
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

// TODO : VER SI ESTO SIRVE PARA ALGO
export const OfferingIncomeSearchSubTypeNames: Record<
  OfferingIncomeSearchSubType,
  string
> = {
  [OfferingIncomeSearchSubType.OfferingByDate]: 'Por fecha',
  [OfferingIncomeSearchSubType.OfferingByChurch]: 'Por iglesia',
  [OfferingIncomeSearchSubType.OfferingByChurchDate]: 'Por fecha e iglesia',

  // Sunday Worship, youngs, school sunday
  [OfferingIncomeSearchSubType.OfferingByShift]: 'Por turno',
  [OfferingIncomeSearchSubType.OfferingByShiftDate]: 'Por fecha y turno',

  // Family House, Fasting Zonal, Vigil Zonal
  [OfferingIncomeSearchSubType.OfferingByZone]: 'Por zona',
  [OfferingIncomeSearchSubType.OfferingByZoneDate]: 'Por zona y fecha',

  // Family House
  [OfferingIncomeSearchSubType.OfferingByPreacherNames]:
    'Por nombres de su predicador',
  [OfferingIncomeSearchSubType.OfferingByPreacherLastNames]:
    'Por apellidos de su predicador',
  [OfferingIncomeSearchSubType.OfferingByPreacherFullName]:
    'Por nombres y apellidos de su predicador',
  [OfferingIncomeSearchSubType.OfferingByGroupCode]: 'Por código de grupo fam.',
  [OfferingIncomeSearchSubType.OfferingByGroupCodeDate]:
    'Por código de grupo fam. y fecha',

  // Offering Ayuno Zonal y Vigilia Zonal
  [OfferingIncomeSearchSubType.OfferingBySupervisorNames]:
    'Por nombres de su supervisor',
  [OfferingIncomeSearchSubType.OfferingBySupervisorLastNames]:
    'Por apellidos de su supervisor',
  [OfferingIncomeSearchSubType.OfferingBySupervisorFullName]:
    'Por nombres y apellidos de su supervisor',

  // Offering Ground Church and Special
  [OfferingIncomeSearchSubType.OfferingByContributorNames]:
    'Por nombres del aportante',
  [OfferingIncomeSearchSubType.OfferingByContributorLastNames]:
    'Por apellidos del aportante',
  [OfferingIncomeSearchSubType.OfferingByContributorFullName]:
    'Por nombres y apellidos del aportante',
};

//* Sunday Worship
export enum SubTypeOfferingIncomeSearchBySundayWorshipAndSundaySchool {
  OfferingByDate = 'offering_by_date',
  OfferingByShift = 'offering_by_shift',
  OfferingByShiftDate = 'offering_by_shift_date',
}

export const SubTypeNamesOfferingIncomeSearchBySundayWorshipAndSundaySchool: Record<
  SubTypeOfferingIncomeSearchBySundayWorshipAndSundaySchool,
  string
> = {
  [SubTypeOfferingIncomeSearchBySundayWorshipAndSundaySchool.OfferingByDate]:
    'Por fecha',
  [SubTypeOfferingIncomeSearchBySundayWorshipAndSundaySchool.OfferingByShift]:
    'Por turno',
  [SubTypeOfferingIncomeSearchBySundayWorshipAndSundaySchool.OfferingByShiftDate]:
    'Por fecha y turno',
};

//* Offering (Family House)
export enum SubTypeOfferingIncomeSearchByFamilyGroup {
  OfferingByZone = 'offering_by_zone',
  OfferingByDate = 'offering_by_date',
  OfferingByZoneDate = 'offering_by_zone_date',
  OfferingByGroupCode = 'offering_by_group_code',
  OfferingByGroupCodeDate = 'offering_by_group_code_date',
  OfferingByPreacherNames = 'offering_by_preacher_names',
  OfferingByPreacherFullName = 'offering_by_preacher_full_name',
  OfferingByPreacherLastNames = 'offering_by_preacher_last_names',
}

export const SubTypeNamesOfferingIncomeSearchByFamilyGroup: Record<
  SubTypeOfferingIncomeSearchByFamilyGroup,
  string
> = {
  [SubTypeOfferingIncomeSearchByFamilyGroup.OfferingByDate]: 'Por fecha',
  [SubTypeOfferingIncomeSearchByFamilyGroup.OfferingByZone]: 'Por zona',
  [SubTypeOfferingIncomeSearchByFamilyGroup.OfferingByZoneDate]:
    'Por zona y fecha',
  [SubTypeOfferingIncomeSearchByFamilyGroup.OfferingByGroupCode]:
    'Por código de grupo',
  [SubTypeOfferingIncomeSearchByFamilyGroup.OfferingByGroupCodeDate]:
    'Por código y fecha',
  [SubTypeOfferingIncomeSearchByFamilyGroup.OfferingByPreacherNames]:
    'Por nombres de su predicador',
  [SubTypeOfferingIncomeSearchByFamilyGroup.OfferingByPreacherLastNames]:
    'Por apellidos de su predicador',
  [SubTypeOfferingIncomeSearchByFamilyGroup.OfferingByPreacherFullName]:
    'Por nombres y apellidos de su predicador',
};

//* Offering (Fasting General, Vigil General)
export enum SubTypeOfferingIncomeSearchByFastingAndVigilGeneral {
  OfferingByDate = 'offering_by_date',
}

export const SubTypeNamesOfferingIncomeSearchByFastingAndVigilGeneral: Record<
  SubTypeOfferingIncomeSearchByFastingAndVigilGeneral,
  string
> = {
  [SubTypeOfferingIncomeSearchByFastingAndVigilGeneral.OfferingByDate]:
    'Por fecha',
};

//* Offering (Fasting Zonal, Vigil Zonal)
export enum SubTypeOfferingIncomeSearchByFastingAndVigilZonal {
  OfferingByDate = 'offering_by_date',
  OfferingByZone = 'offering_by_zone',
  OfferingByZoneDate = 'offering_by_zone_date',
  OfferingBySupervisorNames = 'offering_by_supervisor_names',
  OfferingBySupervisorLastNames = 'offering_by_supervisor_last_names',
  OfferingBySupervisorFullName = 'offering_by_supervisor_full_name',
}

export const SubTypeNamesOfferingIncomeSearchByFastingAndVigilZonal: Record<
  SubTypeOfferingIncomeSearchByFastingAndVigilZonal,
  string
> = {
  [OfferingIncomeSearchSubType.OfferingByDate]: 'Por fecha',
  [OfferingIncomeSearchSubType.OfferingByZone]: 'Por zona',
  [OfferingIncomeSearchSubType.OfferingByZoneDate]: 'Por zona y fecha',
  [OfferingIncomeSearchSubType.OfferingBySupervisorNames]:
    'Por nombres de su supervisor',
  [OfferingIncomeSearchSubType.OfferingBySupervisorLastNames]:
    'Por apellidos de su supervisor',
  [OfferingIncomeSearchSubType.OfferingBySupervisorFullName]:
    'Por nombres y apellidos de su supervisor',
};

//* Offering (Young Worship)
export enum SubTypeOfferingIncomeSearchByYoungWorship {
  OfferingByDate = 'offering_by_date',
}

export const SubTypeNamesOfferingIncomeSearchByYoungWorship: Record<
  SubTypeOfferingIncomeSearchByFastingAndVigilGeneral,
  string
> = {
  [SubTypeOfferingIncomeSearchByYoungWorship.OfferingByDate]: 'Por fecha',
};

//* Offering (Worship United)
export enum SubTypeOfferingIncomeSearchByUnitedWorship {
  OfferingByDate = 'offering_by_date',
}

export const SubTypeNamesOfferingIncomeSearchByUnitedWorship: Record<
  SubTypeOfferingIncomeSearchByUnitedWorship,
  string
> = {
  [SubTypeOfferingIncomeSearchByUnitedWorship.OfferingByDate]: 'Por fecha',
};

//* Offering (Income Adjustment)
export enum SubTypeOfferingIncomeSearchByActivities {
  OfferingByDate = 'offering_by_date',
}

export const SubTypeNamesOfferingIncomeSearchByActivities: Record<
  SubTypeOfferingIncomeSearchByIncomeAdjustment,
  string
> = {
  [SubTypeOfferingIncomeSearchByActivities.OfferingByDate]: 'Por fecha',
};

//* Offering (Activities)
export enum SubTypeOfferingIncomeSearchByIncomeAdjustment {
  OfferingByDate = 'offering_by_date',
}

export const SubTypeNamesOfferingIncomeSearchByIncomeAdjustment: Record<
  SubTypeOfferingIncomeSearchByIncomeAdjustment,
  string
> = {
  [SubTypeOfferingIncomeSearchByIncomeAdjustment.OfferingByDate]: 'Por fecha',
};

//* Offering (Ground Church, Special)
export enum SubTypeOfferingIncomeSearchByGroundChurchAndSpecial {
  OfferingByDate = 'offering_by_date',
  OfferingByContributorNames = 'offering_by_contributor_names',
  OfferingByContributorLastNames = 'offering_by_contributor_last_names',
  OfferingByContributorFullName = 'offering_by_contributor_full_name',
}

export const SubTypeNamesOfferingIncomeSearchByGroundChurchAndSpecial: Record<
  SubTypeOfferingIncomeSearchByGroundChurchAndSpecial,
  string
> = {
  [SubTypeOfferingIncomeSearchByGroundChurchAndSpecial.OfferingByDate]:
    'Por fecha',
  [SubTypeOfferingIncomeSearchByGroundChurchAndSpecial.OfferingByContributorNames]:
    'Por nombres del aportante',
  [SubTypeOfferingIncomeSearchByGroundChurchAndSpecial.OfferingByContributorLastNames]:
    'Por apellidos del aportante',
  [SubTypeOfferingIncomeSearchByGroundChurchAndSpecial.OfferingByContributorFullName]:
    'Por nombres y apellidos del aportante',
};
