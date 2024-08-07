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

  //TODO : renombrar anteponer offering para mas claridad
  //* Offering Income (tithe and offering)
  Tithe = 'tithe',
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
