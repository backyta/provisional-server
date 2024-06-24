export enum SearchType {
  ID = 'id',

  //* Church
  ChurchName = 'church_name',
  FoundingDate = 'founding_date',

  //* Members, Pastor, Copastor, Supervisor, Preacher, Offering, User
  FirstName = 'first_name',
  LastName = 'last_name',
  FullName = 'full_name',

  //* Members, Pastor, Copastor, Supervisor, Preacher
  DateBirth = 'date_birth',
  MonthBirth = 'month_birth',
  Gender = 'gender',
  MaritalStatus = 'marital_status',

  //* Members, Supervisor, Preacher, Family House
  Zone = 'zone',

  //* Members, Supervisor, Preacher, Fam. House,
  CodeHouse = 'code_house',
  NameHouse = 'name_house',

  //* Members, Pastor, Copastor, Sup, Preacher, Family House
  Address = 'address',

  //* Members, Pastor, Copastor, Supervisor, Preacher.
  OriginCountry = 'origin_country',

  //* Members, Pastor, Copastor, Supervisor, Preacher, Family House
  Department = 'department',
  Province = 'province',
  District = 'district',
  UrbanSector = 'urban_sector',

  //* Members, Pastor, Copastor, Supervisor, Preacher, Fam. House, Offering, User
  Status = 'status',

  //* Members, User
  Roles = 'roles',

  //* Offering Income (tithe and offering)
  Tithe = 'tithe',
  SundayWorship = 'sunday_worship',
  FamilyHouse = 'family_house',
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
