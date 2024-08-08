export enum OfferingIncomeCreateSubType {
  SundayWorship = 'sunday_worship',
  GeneralFasting = 'general_fasting',
  GeneralVigil = 'general_vigil',
  ZonalVigil = 'zonal_vigil',
  ZonalFasting = 'zonal_fasting',
  FamilyGroup = 'family_group',
  SundaySchool = 'sunday_school',
  YouthWorship = 'youth_worship',
  UnitedWorship = 'united_worship',
  Special = 'special',
  Activities = 'activities',
  ChurchGround = 'church_ground',
}

export const OfferingIncomeSubTypeNames: Record<
  OfferingIncomeCreateSubType,
  string
> = {
  sunday_worship: 'Culto Dominical',
  family_group: 'Grupo Familiar',
  general_fasting: 'Ayuno General',
  general_vigil: 'Vigilia General',
  zonal_fasting: 'Ayuno Zonal',
  zonal_vigil: 'Vigilia Zonal',
  sunday_school: 'Escuela Dominical',
  youth_worship: 'Culto Jóvenes',
  united_worship: 'Culto Unido',
  activities: 'Actividades',
  church_ground: 'Terreno Iglesia',
  special: 'Especial',
};
