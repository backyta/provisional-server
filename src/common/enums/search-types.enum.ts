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

  //* Offering Expenses
  OperationalExpenses = 'operative_expenses',
  MaintenanceAndRepairExpenses = 'maintenance_and_repair_expenses',
  DecorationExpenses = 'decoration_expenses',
  EquipmentAndTechnologyExpenses = 'equipment_and_technology_expenses',
  SuppliesExpenses = 'supplies_expenses',
  ActivitiesAndEventsExpenses = 'activities_and_events_expenses',
  ExpensesAdjustment = 'expenses_adjustment',
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

  [SearchType.OperationalExpenses]: 'Gastos Operativos',
  [SearchType.MaintenanceAndRepairExpenses]:
    'Gastos de Mantenimiento y Reparación',
  [SearchType.DecorationExpenses]: 'Gastos de Decoración',
  [SearchType.EquipmentAndTechnologyExpenses]: 'Gastos de Equipos y Tecnología',
  [SearchType.SuppliesExpenses]: 'Gastos de Suministros',
  [SearchType.ActivitiesAndEventsExpenses]: 'Gastos de Actividades y Eventos',
  [SearchType.ExpensesAdjustment]: 'Ajuste de Gastos',
};
