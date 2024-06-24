export enum SearchSubType {
  //* Member
  MemberByPastorNames = 'member_by_pastor_names',
  MemberByPastorLastNames = 'member_by_pastor_last_names',
  MemberByPastorFullName = 'member_by_pastor_full_name',
  MemberByCopastorNames = 'member_by_copastor_names',
  MemberByCopastorLastNames = 'member_by_copastor_last_names',
  MemberByCopastorFullName = 'member_by_copastor_full_name',
  MemberBySupervisorNames = 'member_by_supervisor_names',
  MemberBySupervisorLastNames = 'member_by_supervisor_last_names',
  MemberBySupervisorFullName = 'member_by_supervisor_full_name',
  MemberByPreacherNames = 'member_by_preacher_names',
  MemberByPreacherLastNames = 'member_by_preacher_last_names',
  MemberByPreacherFullName = 'member_by_preacher_full_name',
  ByMemberNames = 'by_member_names',
  ByMemberLastNames = 'by_member_last_names',
  ByMemberFullName = 'by_member_full_name',

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

  //* Leaders
  LeaderByPastorNames = 'leader_by_pastor_names',
  LeaderByPastorLastNames = 'leader_by_pastor_last_names',
  LeaderByPastorFullName = 'leader_by_pastor_full_name',
  LeaderByCopastorNames = 'leader_by_copastor_names',
  LeaderByCopastorLastNames = 'leader_by_copastor_last_names',
  LeaderByCopastorFullName = 'leader_by_copastor_full_name',
  LeaderBySupervisorNames = 'leader_by_supervisor_names',
  LeaderBySupervisorLastNames = 'leader_by_supervisor_last_names',
  LeaderBySupervisorFullName = 'leader_by_supervisor_full_name',
  ByLeaderNames = 'by_leader_names',
  ByLeaderLastNames = 'by_leader_last_names',
  ByLeaderFullName = 'by_leader_full_name',

  //* Module Family Home
  FamilyHouseByPastorNames = 'family_house_by_pastor_names',
  FamilyHouseByPastorLastNames = 'family_house_by_pastor_last_names',
  FamilyHouseByPastorFullName = 'family_house_by_pastor_full_name',
  FamilyHouseByCopastorNames = 'family_house_by_copastor_names',
  FamilyHouseByCopastorLastaNames = 'family_house_by_copastor_last_names',
  FamilyHouseByCopastorFullName = 'family_house_by_copastor_full_name',
  FamilyHouseBySupervisorNames = 'family_house_by_supervisor_names',
  FamilyHouseBySupervisorLastNames = 'family_house_by_supervisor_last_names',
  FamilyHouseBySupervisorFullName = 'family_house_by_supervisor_full_name',
  FamilyHouseByPreacherNames = 'family_house_by_preacher_names',
  FamilyHouseByPreacherLastNames = 'family_house_by_preacher_last_names',
  FamilyHouseByPreacherFullName = 'family_house_by_preacher_full_name',

  //* Tithe
  TitheByNames = 'tithe_by_names',
  TitheByLastNames = 'tithe_by_last_names',
  TitheByFullName = 'tithe_by_full_name',
  TitheByDate = 'tithe_by_date',
  TitheByDateNames = 'tithe_by_date_names',
  TitheByDateLastNames = 'tithe_by_date_last_names',
  TitheByDateFullName = 'tithe_by_date_full_name',

  // ! Offering Income
  //* Family House, Fasting Zonal, Fasting General, Vigil Zonal, vigilia General, Ground Church, Activities, Youngs
  OfferingByDate = 'offering_by_date',

  //* Sunday Worship, youngs, school sunday
  OfferingByShift = 'offering_by_shift',
  OfferingByDateShift = 'offering_by_date_shift',

  //* Family House, Fasting Zonal, Vigil Zonal
  OfferingByZone = 'offering_by_zone',
  OfferingByDateZone = 'offering_by_date_zone',

  //* Offering Family House
  OfferingByDateCodeHouse = 'offering_by_date_code_house',
  OfferingByCodeHouse = 'offering_by_code_house',
  OfferingByPreacherNames = 'offering_by_preacher_names',
  OfferingByPreacherLastNames = 'offering_by_preacher_last_names',
  OfferingByPreacherFullName = 'offering_by_preacher_full_name',

  //* Offering Ayuno y Vigilia Zonal
  OfferingBySupervisorNames = 'offering_by_supervisor_names',
  OfferingBySupervisorLastNames = 'offering_by_supervisor_last_names',
  OfferingBySupervisorFullName = 'offering_by_supervisor_full_name',

  //* Offering Ground Church and Special
  OfferingByNames = 'offering_by_names',
  OfferingByLastNames = 'offering_by_last_names',
  OfferingByFullName = 'offering_by_full_name',

  // ! Offering Expenses
  //* Operational Expenses
  VenueRental = 'venue_rental',
  PublicServices = 'public_services',
  AdvertisingAndEventPromotion = 'advertising_and_event_promotion',
  TravelAndTransportation = 'travel_and_transportation',
  SecurityAndSurveillance = 'security_and_surveillance',
  OtherAdministrativeExpenses = 'other_administrative_expenses',

  //* Maintenance and Repair Expenses
  PlumbingServices = 'plumbing_services',
  ElectricalServices = 'electrical_services',
  PaintingAndTouchUpsServices = 'painting_and_touch_ups_services',
  DeepCleaningServices = 'deep_cleaning_services',
  HeatingAndACSystemMaintenance = 'heating_and_ac_system_maintenance',
  SoundAndLightingEquipmentRepairAndMaintenance = 'sound_and_lighting_equipment_repair_and_maintenance',
  GardenAndExteriorMaintenance = 'garden_and_exterior_maintenance',
  OtherEquipmentRepairsAndMaintenance = 'other_equipment_repairs_and_maintenance',
  FurnitureRepairAndMaintenance = 'furniture_repair_and_maintenance',
  ComputerEquipmentRepairAndMaintenance = 'computer_equipment_repair_and_maintenance',
  RoofAndStructuralRepairs = 'roof_and_structural_repairs',
  DoorAndWindowRepairs = 'door_and_window_repairs',

  //* Decoration Expenses
  PurchaseFlowersAndPlants = 'purchase_flowers_and_plants',
  PurchaseDecorativeFurniture = 'purchase_decorative_furniture',
  PurchaseDecorativeItems = 'purchase_decorative_items',
  AltarAndWorshipAreaDecorationService = 'altar_and_worship_area_decoration_service',

  //* Equipment and Technology Expenses
  SoundEquipment = 'sound_equipment',
  ComputerEquipment = 'computer_equipment',
  ProjectionEquipment = 'projection_equipment',
  HvacEquipment = 'hvac_equipment',
  LightingEquipment = 'lighting_equipment',
  SecurityEquipment = 'security_equipment',
  OfficeEquipment = 'office_equipment',
  AudioVideoRecordingEquipment = 'audio_video_recording_equipment',
  Furniture = 'furniture',
  MusicalInstruments = 'musical_instruments',
  InternetTelecommunicationsServices = 'internet_and_telecommunications_services',
  HostingSoftwareServices = 'hosting_and_software_services',

  //* Supplies Expenses
  KitchenUtensils = 'kitchen_utensils',
  OfficeSupplies = 'office_supplies',
  CookingIngredients = 'cooking_ingredients',
  CleaningMaterials = 'cleaning_materials',
  PackagingMaterials = 'packaging_and_storage_materials',
  SundaySchoolMaterials = 'sunday_school_educational_materials',

  //* Activities and Events Expenses
  SpecialGuestFees = 'fees_special_guests',
  ExternalVenueRental = 'rental_external_venues',
  DecorationsAndAmbiance = 'decorations_and_ambiance',
  FoodAndBeverage = 'food_beverage',
  PromotionalMaterials = 'promotional_materials',
  TransportationSpecialGuests = 'transportation_special_guests',
  EquipmentTransportation = 'equipment_transportation',
  SupportStaffFees = 'fees_support_staff',
  RentalTechnicalAndLogisticEquipment = 'rental_technical_and_logistical_equipment',
  EducationalMaterialsAndResources = 'educational_materials_and_resources',
  GiftsAndPrizesParticipants = 'gifts_and_prizes_participants',
  OtherRelatedExpenses = 'other_related_expenses',

  //* Users
  UserByNames = 'user_by_names',
  UserByLastNames = 'user_by_last_names',
  UserByFullName = 'user_by_full_name',
  UserByRoles = 'user_by_roles',
}
