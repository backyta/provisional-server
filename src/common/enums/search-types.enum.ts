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

  //* Offering Income
  SundayService = 'sunday_service',
  FamilyGroup = 'family_group',
  GeneralFasting = 'general_fasting',
  GeneralVigil = 'general_vigil',
  ZonalFasting = 'zonal_fasting',
  ZonalVigil = 'zonal_vigil',
  SundaySchool = 'sunday_school',
  YouthService = 'youth_service',
  UnitedService = 'united_service',
  Activities = 'activities',
  ChurchGround = 'church_ground',
  Special = 'special',
  IncomeAdjustment = 'income_adjustment',

  //* Metrics
  LastSundaysOfferings = 'last_sundays_offerings',
  TopFamilyGroupsOfferings = 'top_family_groups_offerings',
  MostPopulatedFamilyGroups = 'most_populated_family_groups',
  LessPopulatedFamilyGroups = 'less_populated_family_groups',

  //* Offering Expenses
  OperationalExpenses = 'operational_expenses',
  MaintenanceAndRepairExpenses = 'maintenance_and_repair_expenses',
  DecorationExpenses = 'decoration_expenses',
  EquipmentAndTechnologyExpenses = 'equipment_and_technology_expenses',
  SuppliesExpenses = 'supplies_expenses',
  PlaningEventsExpenses = 'planing_events_expenses',
  ExpensesAdjustment = 'expenses_adjustment',

  //* Metrics
  MembersByProportion = 'members_by_proportion',
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

  FamilyGroupsByProportion = 'family_groups_by_proportion',
  FamilyGroupsFluctuationByYear = 'family_groups_fluctuation_by_year',
  FamilyGroupsByCode = 'family_groups_by_code',
  FamilyGroupsByZone = 'family_groups_by_zone',
  FamilyGroupsByDistrict = 'family_groups_by_district',
  FamilyGroupsByServiceTime = 'family_groups_by_service_time',
  FamilyGroupsByRecordStatus = 'family_groups_by_record_status',

  OfferingIncomeByProportion = 'offering_income_by_proportion',
  OfferingIncomeBySundayService = 'offering_income_by_sunday_service',
  OfferingIncomeByFamilyGroup = 'offering_income_by_family_group',
  OfferingIncomeBySundaySchool = 'offering_income_by_sunday_school',
  OfferingIncomeByFastingAndVigil = 'offering_income_by_fasting_and_vigil',
  OfferingIncomeByYouthService = 'offering_income_by_youth_service',
  OfferingIncomeBySpecialOffering = 'offering_income_by_special_offering',
  OfferingIncomeByChurchGround = 'offering_income_by_church_ground',
  OfferingIncomeByUnitedService = 'offering_income_by_united_service',
  OfferingIncomeByActivities = 'offering_income_by_activities',
  OfferingIncomeAdjustment = 'offering_income_adjustment',

  OfferingExpensesByProportion = 'offering_expenses_by_proportion',
  OperationalOfferingExpenses = 'operational_offering_expenses',
  MaintenanceAndRepairOfferingExpenses = 'maintenance_and_repair_offering_expenses',
  DecorationOfferingExpenses = 'decoration_offering_expenses',
  EquipmentAndTechnologyOfferingExpenses = 'equipment_and_technology_offering_expenses',
  SuppliesOfferingExpenses = 'supplies_offering_expenses',
  PlaningEventsOfferingExpenses = 'planing_events_offering_expenses',
  OfferingExpensesAdjustment = 'offering_expenses_adjustment',

  OfferingExpensesAndOfferingIncomeByProportion = 'offering_expenses_and_offering_income_by_proportion',
  IncomeAndExpensesComparativeByYear = 'income_and_expense_comparative_by_year',
  GeneralComparativeOfferingIncome = 'general_comparative_offering_income',
  ComparativeOfferingIncomeByType = 'comparative_offering_income_by_type',
  GeneralComparativeOfferingExpenses = 'general_comparative_offering_expenses',
  ComparativeOfferingExpensesByType = 'comparative_offering_expenses_by_type',
  ComparativeOfferingExpensesBySubType = 'comparative_offering_expenses_by_sub_type',
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

  [SearchType.RecordStatus]: 'Estado de Registro',

  [SearchType.Roles]: 'Roles',

  [SearchType.SundayService]: 'Culto Dominical',
  [SearchType.FamilyGroup]: 'Grupo Familiar',
  [SearchType.GeneralFasting]: 'Ayuno General',
  [SearchType.GeneralVigil]: 'Vigilia General',
  [SearchType.ZonalFasting]: 'Ayuno Zonal',
  [SearchType.ZonalVigil]: 'Vigilia Zonal',
  [SearchType.SundaySchool]: 'Escuela Dominical',
  [SearchType.YouthService]: 'Culto Jóvenes',
  [SearchType.UnitedService]: 'Culto Unido',
  [SearchType.Activities]: 'Actividades',
  [SearchType.ChurchGround]: 'Terreno Iglesia',
  [SearchType.Special]: 'Especial',
  [SearchType.IncomeAdjustment]: 'Ajuste por Ingresos',

  [SearchType.LastSundaysOfferings]: 'Ultimas Ofrendas Dominicales',
  [SearchType.TopFamilyGroupsOfferings]: 'Top Ofrendas Grupos Familiares',
  [SearchType.MostPopulatedFamilyGroups]: 'Grupos Familiares mas poblados',
  [SearchType.LessPopulatedFamilyGroups]: 'Grupos Familiares menos poblados',

  [SearchType.OperationalExpenses]: 'Gastos Operativos',
  [SearchType.MaintenanceAndRepairExpenses]:
    'Gastos de Mantenimiento y Reparación',
  [SearchType.DecorationExpenses]: 'Gastos de Decoración',
  [SearchType.EquipmentAndTechnologyExpenses]: 'Gastos de Equipos y Tecnología',
  [SearchType.SuppliesExpenses]: 'Gastos de Suministros',
  [SearchType.PlaningEventsExpenses]: 'Gastos de Actividades y Eventos',
  [SearchType.ExpensesAdjustment]: 'Ajuste de Gastos',

  //* Metrics
  [SearchType.MembersByProportion]: 'Análisis de proporción de miembros',
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

  [SearchType.FamilyGroupsByProportion]:
    'Análisis de proporción de grupos familiares',
  [SearchType.FamilyGroupsFluctuationByYear]:
    'Análisis de fluctuación de grupos familiares por año',
  [SearchType.FamilyGroupsByCode]: 'Análisis de grupos familiares por código',
  [SearchType.FamilyGroupsByZone]: 'Análisis de grupos familiares por zona',
  [SearchType.FamilyGroupsByDistrict]:
    'Análisis de grupos familiares por distrito',
  [SearchType.FamilyGroupsByServiceTime]:
    'Análisis de grupos familiares por horario de culto',
  [SearchType.FamilyGroupsByRecordStatus]:
    'Análisis de grupos familiares por estado de registro',

  [SearchType.OfferingIncomeByProportion]:
    'Análisis de proporción de ingresos de ofrenda',
  [SearchType.OfferingIncomeBySundayService]:
    'Análisis de ingresos de ofrenda por culto dominical.',
  [SearchType.OfferingIncomeByFamilyGroup]:
    'Análisis de ingresos de ofrenda por grupo familiar.',
  [SearchType.OfferingIncomeBySundaySchool]:
    'Análisis de ingresos de ofrenda por escuela dominical.',
  [SearchType.OfferingIncomeByFastingAndVigil]:
    'Análisis de ingresos de ofrenda por ayuno y vigilia.',
  [SearchType.OfferingIncomeByYouthService]:
    'Análisis de ingresos de ofrenda por culto juvenil.',
  [SearchType.OfferingIncomeBySpecialOffering]:
    'Análisis de ingresos de ofrenda por ofrenda especial.',
  [SearchType.OfferingIncomeByChurchGround]:
    'Análisis de ingresos de ofrenda por terreno iglesia.',
  [SearchType.OfferingIncomeByUnitedService]:
    'Análisis de ingresos de ofrenda por culto unido.',
  [SearchType.OfferingIncomeByActivities]:
    'Análisis de ingresos de ofrenda por actividades.',
  [SearchType.OfferingIncomeAdjustment]:
    'Análisis de ingresos de ofrenda por ajustes de ingreso.',

  [SearchType.OfferingExpensesByProportion]:
    'Análisis de proporción de salidas de ofrenda',
  [SearchType.OperationalOfferingExpenses]:
    'Análisis de ofrendas por gastos operativos.',
  [SearchType.MaintenanceAndRepairOfferingExpenses]:
    'Análisis de salidas de ofrenda por gastos de mantenimiento y reparación.',
  [SearchType.DecorationOfferingExpenses]:
    'Análisis de salidas de ofrenda por gastos de decoración.',
  [SearchType.EquipmentAndTechnologyOfferingExpenses]:
    'Análisis de salidas de ofrenda por gastos de equipamiento y tecnología.',
  [SearchType.SuppliesOfferingExpenses]:
    'Análisis de salidas de ofrenda por gastos de suministros.',
  [SearchType.PlaningEventsOfferingExpenses]:
    'Análisis de salidas de ofrenda por gastos de planificación de eventos.',
  [SearchType.OfferingExpensesAdjustment]:
    'Análisis de salidas de ofrenda por ajustes de salida.',

  [SearchType.OfferingExpensesAndOfferingIncomeByProportion]:
    'Análisis de proporción de ingresos y salidas de ofrendas.',
  [SearchType.IncomeAndExpensesComparativeByYear]:
    'Análisis de comparación de ingresos y salidas de ofrenda.',
  [SearchType.GeneralComparativeOfferingIncome]:
    'Análisis de comparación general de ingreso de ofrenda.',
  [SearchType.ComparativeOfferingIncomeByType]:
    'Análisis de comparación de ingreso de ofrenda por tipo.',
  [SearchType.GeneralComparativeOfferingExpenses]:
    'Análisis de comparación de salida de ofrenda por tipo.',
  [SearchType.ComparativeOfferingExpensesByType]:
    'Análisis de comparación de salida de ofrenda por tipo.',
  [SearchType.ComparativeOfferingExpensesBySubType]:
    'Análisis de comparación de salida de ofrenda por sub-tipo.',
};
