export enum SearchSubType {
  //? Members
  //* Disciple
  DiscipleByPastorNames = 'disciple_by_pastor_names',
  DiscipleByPastorLastNames = 'disciple_by_pastor_last_names',
  DiscipleByPastorFullName = 'disciple_by_pastor_full_name',
  DiscipleByCopastorNames = 'disciple_by_copastor_names',
  DiscipleByCopastorLastNames = 'disciple_by_copastor_last_names',
  DiscipleByCopastorFullName = 'disciple_by_copastor_full_name',
  DiscipleBySupervisorNames = 'disciple_by_supervisor_names',
  DiscipleBySupervisorLastNames = 'disciple_by_supervisor_last_names',
  DiscipleBySupervisorFullName = 'disciple_by_supervisor_full_name',
  DiscipleByPreacherNames = 'disciple_by_preacher_names',
  DiscipleByPreacherLastNames = 'disciple_by_preacher_last_names',
  DiscipleByPreacherFullName = 'disciple_by_preacher_full_name',
  ByDiscipleNames = 'by_disciple_names',
  ByDiscipleLastNames = 'by_disciple_last_names',
  ByDiscipleFullName = 'by_disciple_full_name',

  //* Pastor
  ByPastorNames = 'by_pastor_names',
  ByPastorLastNames = 'by_pastor_last_names',
  ByPastorFullName = 'by_pastor_full_name',

  //* Copastor
  CopastorByPastorNames = 'copastor_by_pastor_names',
  CopastorByPastorLastNames = 'copastor_by_pastor_last_names',
  CopastorByPastorFullName = 'copastor_by_pastor_full_name',
  ByCopastorNames = 'by_copastor_names',
  ByCopastorLastNames = 'by_copastor_last_names',
  ByCopastorFullName = 'by_copastor_full_name',

  //* Supervisor
  SupervisorByPastorNames = 'supervisor_by_pastor_names',
  SupervisorByPastorLastNames = 'supervisor_by_pastor_last_names',
  SupervisorByPastorFullName = 'supervisor_by_pastor_full_name',
  SupervisorByCopastorNames = 'supervisor_by_copastor_names',
  SupervisorByCopastorLastNames = 'supervisor_by_copastor_last_names',
  SupervisorByCopastorFullName = 'supervisor_by_copastor_full_name',
  BySupervisorNames = 'by_supervisor_names',
  BySupervisorLastNames = 'by_supervisor_last_names',
  BySupervisorFullName = 'by_supervisor_full_name',

  //* Preacher
  PreacherByPastorNames = 'preacher_by_pastor_names',
  PreacherByPastorLastNames = 'preacher_by_pastor_last_names',
  PreacherByPastorFullName = 'preacher_by_pastor_full_name',
  PreacherByCopastorNames = 'preacher_by_copastor_names',
  PreacherByCopastorLastNames = 'preacher_by_copastor_last_names',
  PreacherByCopastorFullName = 'preacher_by_copastor_full_name',
  PreacherBySupervisorNames = 'preacher_by_supervisor_names',
  PreacherBySupervisorLastNames = 'preacher_by_supervisor_last_names',
  PreacherBySupervisorFullName = 'preacher_by_supervisor_full_name',
  ByPreacherNames = 'by_preacher_names',
  ByPreacherLastNames = 'by_preacher_last_names',
  ByPreacherFullName = 'by_preacher_full_name',

  //* Module Family Group
  FamilyGroupByPastorNames = 'family_group_by_pastor_names',
  FamilyGroupByPastorLastNames = 'family_group_by_pastor_last_names',
  FamilyGroupByPastorFullName = 'family_group_by_pastor_full_name',
  FamilyGroupByCopastorNames = 'family_group_by_copastor_names',
  FamilyGroupByCopastorLastNames = 'family_group_by_copastor_last_names',
  FamilyGroupByCopastorFullName = 'family_group_by_copastor_full_name',
  FamilyGroupBySupervisorNames = 'family_group_by_supervisor_names',
  FamilyGroupBySupervisorLastNames = 'family_group_by_supervisor_last_names',
  FamilyGroupBySupervisorFullName = 'family_group_by_supervisor_full_name',
  FamilyGroupByPreacherNames = 'family_group_by_preacher_names',
  FamilyGroupByPreacherLastNames = 'family_group_by_preacher_last_names',
  FamilyGroupByPreacherFullName = 'family_group_by_preacher_full_name',

  // ? Offering Income
  //* Family House, Fasting Zonal, Fasting General, Vigil Zonal, vigilia General, Ground Church, Activities, Youngs
  OfferingByDate = 'offering_by_date',
  OfferingByChurch = 'offering_by_church',
  OfferingByChurchDate = 'offering_by_church_date',

  //* Sunday Service, youngs, school sunday
  OfferingByShift = 'offering_by_shift',
  OfferingByShiftDate = 'offering_by_shift_date',

  //* Family House, Fasting Zonal, Vigil Zonal
  OfferingByZone = 'offering_by_zone',
  OfferingByZoneDate = 'offering_by_zone_date',

  //* Offering Family House
  OfferingByGroupCode = 'offering_by_group_code',
  OfferingByGroupCodeDate = 'offering_by_group_code_date',
  OfferingByPreacherNames = 'offering_by_preacher_names',
  OfferingByPreacherLastNames = 'offering_by_preacher_last_names',
  OfferingByPreacherFullName = 'offering_by_preacher_full_name',

  //* Offering Ayuno y Vigilia Zonal
  OfferingBySupervisorNames = 'offering_by_supervisor_names',
  OfferingBySupervisorLastNames = 'offering_by_supervisor_last_names',
  OfferingBySupervisorFullName = 'offering_by_supervisor_full_name',

  //* Offering Ground Church and Special
  OfferingByContributorNames = 'offering_by_contributor_names',
  OfferingByContributorLastNames = 'offering_by_contributor_last_names',
  OfferingByContributorFullName = 'offering_by_contributor_full_name',

  // ? Offering Expenses
  //* Operative Expenses
  VenueRental = 'venue_rental',
  PublicServices = 'public_services',
  TransportationAndTravelAllowance = 'transportation_and_travel_allowance',
  InsuranceAndTaxes = 'insurance_and_taxes',
  SecurityAndSurveillance = 'security_and_surveillance',
  OtherAdministrativeExpenses = 'other_administrative_expenses',

  //* Maintenance and Repair Expenses
  PlumbingServices = 'plumbing_services',
  ElectricalServices = 'electrical_services',
  PaintingAndTouchUpsServices = 'painting_and_touch_ups_services',
  CleaningServices = 'cleaning_services',
  HeatingAndACSystemMaintenance = 'heating_and_ac_system_maintenance',
  SoundAndLightingEquipmentMaintenance = 'sound_and_lighting_equipment_maintenance',
  SoundAndLightingEquipmentRepairs = 'sound_and_lighting_equipment_repairs',
  GardenAndExteriorMaintenance = 'garden_and_exterior_maintenance',
  GeneralEquipmentRepairs = 'general_equipment_repairs',
  GeneralEquipmentMaintenance = 'general_equipment_maintenance',
  FurnitureRepairAndMaintenance = 'furniture_repair_and_maintenance',
  ComputerEquipmentRepairAndMaintenance = 'computer_equipment_repair_and_maintenance',
  RoofAndStructuralRepairs = 'roof_and_structural_repairs',
  DoorAndWindowRepairs = 'door_and_window_repairs',

  //* Decoration Expenses
  PurchaseFlowersAndPlants = 'purchase_flowers_and_plants',
  PurchaseDecorativeFurniture = 'purchase_decorative_furniture',
  PurchaseDecorativeItems = 'purchase_decorative_items',
  DecorationServices = 'decoration_services',
  LightingAndIlluminationServices = 'lighting_and_illumination_services',
  StageSetupServices = 'stage_setup_services',
  EventDecorationRentals = 'event_decoration_rentals',
  CleaningPostEventServices = 'cleaning_post_event_services',

  //* Equipment and Technology Expenses
  SoundEquipment = 'sound_equipment',
  ProjectionEquipment = 'projection_equipment',
  HvacEquipment = 'hvac_equipment',
  LightingEquipment = 'lighting_equipment',
  SecurityEquipment = 'security_equipment',
  ComputerEquipment = 'computer_equipment',
  OfficeEquipment = 'office_equipment',
  KitchenEquipment = 'kitchen_equipment',
  CleaningEquipment = 'cleaning_equipment',
  AudioVideoRecordingEquipment = 'audio_video_recording_equipment',
  OfficeFurniture = 'office_furniture',
  KitchenFurniture = 'kitchen_furniture',
  GeneralFurniture = 'general_furniture',
  MusicalInstruments = 'musical_instruments',
  InternetTelephoneServices = 'internet_and_telephone_services',
  HostingSoftwareServices = 'hosting_and_software_services',

  //* Supplies Expenses
  KitchenUtensils = 'kitchen_utensils',
  OfficeSupplies = 'office_supplies',
  CookingIngredients = 'cooking_ingredients',
  CleaningMaterials = 'cleaning_materials',
  PackagingMaterials = 'packaging_and_storage_materials',
  SundaySchoolMaterials = 'sunday_school_educational_materials',

  //* Planing Events Expenses
  AdvertisingAndEventPromotion = 'advertising_and_event_promotion',
  SpecialGuestsFees = 'special_guests_fess',
  SecurityPersonnelFees = 'security_personnel_fees',
  SupportStaffFees = 'support_staff_fees',
  ExternalVenueRental = 'external_venue_rental',
  FoodAndBeverage = 'food_and_beverage',
  TransportationSpecialGuests = 'transportation_special_guests',
  EquipmentTransportation = 'equipment_transportation',
  RentalTechnicalEquipment = 'rental_technical_equipment',
  EducationalMaterials = 'educational_materials',
  GiftsAndPrizesParticipants = 'gifts_and_prizes_participants',
  OtherRelatedExpenses = 'other_related_expenses',

  //? Users
  UserByNames = 'user_by_names',
  UserByLastNames = 'user_by_last_names',
  UserByFullName = 'user_by_full_name',
  UserByRoles = 'user_by_roles',
}
