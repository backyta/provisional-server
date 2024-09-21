export enum SearchType {
  //* Church
  ChurchName = 'church_name',
  FoundingDate = 'founding_date',

  //* Disciple, Pastor, Copastor, Supervisor, Preacher, Offering, User
  FirstName = 'first_name',
  LastName = 'last_name',
  FullName = 'full_name',

  //* Disciple, Pastor, Copastor, Supervisor, Preacher
  BirthDate = 'birth_date',
  BirthMonth = 'birth_month',
  Gender = 'gender',
  MaritalStatus = 'marital_status',

  //* Disciple, Supervisor, Preacher, Family House
  ZoneName = 'zone_name',
  ZoneId = 'zone_id',
  CopastorId = 'copastor_id',

  //* Disciple, Supervisor, Preacher, Fam. House,
  FamilyGroupCode = 'family_group_code',
  FamilyGroupName = 'family_group_name',

  //* Disciple, Pastor, Copastor, Sup, Preacher, Family House
  Address = 'address',

  //* Disciple, Pastor, Copastor, Supervisor, Preacher.
  OriginCountry = 'origin_country',

  //* Disciple, Pastor, Copastor, Supervisor, Preacher, Family House
  Country = 'country',
  Department = 'department',
  Province = 'province',
  District = 'district',
  UrbanSector = 'urban_sector',

  //* Disciple, Pastor, Copastor, Supervisor, Preacher, Fam. House, Offering, User
  RecordStatus = 'record_status',

  //* Disciple, User
  Roles = 'roles',

  //* Offering Income (tithe and offering)
  SundayWorship = 'sunday_worship',
  FamilyGroup = 'family_group',
  GeneralFasting = 'general_fasting',
  GeneralVigil = 'general_vigil',
  ZonalFasting = 'zonal_fasting',
  ZonalVigil = 'zonal_vigil',
  SundaySchool = 'sunday_school',
  YouthWorship = 'youth_worship',
  UnitedWorship = 'united_worship',
  Activities = 'activities',
  ChurchGround = 'church_ground',
  Special = 'special',
  IncomeAdjustment = 'income_adjustment',

  LastSundaysOfferings = 'last_sundays_offerings',
  TopFamilyGroupsOfferings = 'top_family_groups_offerings',
  MostPopulatedFamilyGroups = 'most_populated_family_groups',
  LessPopulatedFamilyGroups = 'less_populated_family_groups',

  //* Offering Expenses
  OperationalExpense = 'operative_expense',
  MaintenanceAndRepairExpense = 'maintenance_and_repair_expense',
  DecorationExpense = 'decoration_expense',
  EquipmentAndTechnologyExpense = 'equipment_and_technology_expense',
  SuppliesExpense = 'supplies_expense',
  ActivitiesAndEventsExpense = 'activities_and_events_expense',
  ExpenseAdjustment = 'expense_adjustment',

  //* Metrics
  MembersFluctuationByYear = 'members_fluctuation_by_year',
  MembersByBirthMonth = 'members_by_birth_month',
  MembersByCategory = 'members_by_category',
  MembersByCategoryAndGender = 'members_by_category_and_gender',
  MembersByRoleAndGender = 'members_by_role_and_gender',
  MembersByMaritalStatus = 'members_by_marital_status',
  MembersByZoneAndGender = 'members_by_zone_and_gender',
  PreachersByZoneAndGender = 'preachers_by_zone_and_gender',
  MembersByDistrictAndGender = 'members_by_district_and_gender',
  MembersByRecordStatus = 'members_by_record_status',
}

export const SearchTypeNames: Record<SearchType, string> = {
  [SearchType.ChurchName]: 'Nombre de Iglesia',
  [SearchType.FoundingDate]: 'Fecha de Fundación',

  [SearchType.FirstName]: 'Nombres',
  [SearchType.LastName]: 'Apellidos',
  [SearchType.FullName]: 'Nombre Completo',

  [SearchType.BirthDate]: 'Fecha de Nacimiento',
  [SearchType.BirthMonth]: 'Mes de Nacimiento',
  [SearchType.Gender]: 'Género',
  [SearchType.MaritalStatus]: 'Estado Civil',

  [SearchType.ZoneName]: 'Nombre de Zona',
  [SearchType.ZoneId]: 'ID de Zona',
  [SearchType.CopastorId]: 'ID de Copastor',

  [SearchType.FamilyGroupCode]: 'Código de Grupo Familiar',
  [SearchType.FamilyGroupName]: 'Nombre de Grupo Familiar',

  [SearchType.Address]: 'Dirección',

  [SearchType.OriginCountry]: 'País de Origen',

  [SearchType.Country]: 'País',
  [SearchType.Department]: 'Departamento',
  [SearchType.Province]: 'Provincia',
  [SearchType.District]: 'Distrito',
  [SearchType.UrbanSector]: 'Sector Urbano',

  [SearchType.RecordStatus]: 'Estado del Registro',

  [SearchType.Roles]: 'Roles',

  [SearchType.SundayWorship]: 'Culto Dominical',
  [SearchType.FamilyGroup]: 'Grupo Familiar',
  [SearchType.GeneralFasting]: 'Ayuno General',
  [SearchType.GeneralVigil]: 'Vigilia General',
  [SearchType.ZonalFasting]: 'Ayuno Zonal',
  [SearchType.ZonalVigil]: 'Vigilia Zonal',
  [SearchType.SundaySchool]: 'Escuela Dominical',
  [SearchType.YouthWorship]: 'Culto Jóvenes',
  [SearchType.UnitedWorship]: 'Culto Unido',
  [SearchType.Activities]: 'Actividades',
  [SearchType.ChurchGround]: 'Terreno Iglesia',
  [SearchType.Special]: 'Especial',
  [SearchType.IncomeAdjustment]: 'Ajuste por Ingresos',

  [SearchType.LastSundaysOfferings]: 'Ultimas Ofrendas Dominicales',
  [SearchType.TopFamilyGroupsOfferings]: 'Top Ofrendas Grupos Familiares',
  [SearchType.MostPopulatedFamilyGroups]: 'Grupos Familiares mas poblados',
  [SearchType.LessPopulatedFamilyGroups]: 'Grupos Familiares menos poblados',

  [SearchType.OperationalExpense]: 'Gastos Operativos',
  [SearchType.MaintenanceAndRepairExpense]:
    'Gastos de Mantenimiento y Reparación',
  [SearchType.DecorationExpense]: 'Gastos de Decoración',
  [SearchType.EquipmentAndTechnologyExpense]: 'Gastos de Equipos y Tecnología',
  [SearchType.SuppliesExpense]: 'Gastos de Suministros',
  [SearchType.ActivitiesAndEventsExpense]: 'Gastos de Actividades y Eventos',
  [SearchType.ExpenseAdjustment]: 'Ajuste de Gastos',

  //* Metrics
  [SearchType.MembersFluctuationByYear]:
    'Análisis de fluctuación de miembros por año',
  [SearchType.MembersByBirthMonth]:
    'Análisis de miembros por mes de nacimiento',
  [SearchType.MembersByCategory]: 'Análisis de miembros por categoría',
  [SearchType.MembersByCategoryAndGender]:
    'Análisis de miembros por categoría y género',
  [SearchType.MembersByRoleAndGender]: 'Análisis de miembros por rol y género',
  [SearchType.MembersByMaritalStatus]: 'Análisis de miembros por estado civil',
  [SearchType.MembersByZoneAndGender]: 'Análisis de miembros por zona y genero',
  [SearchType.PreachersByZoneAndGender]:
    'Análisis de predicadores por zona y genero',
  [SearchType.MembersByDistrictAndGender]:
    'Análisis de miembros por distrito y genero',
  [SearchType.MembersByRecordStatus]:
    'Análisis de miembros por estado de registro',
};
