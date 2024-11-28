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
  // ByPastorNames = 'by_pastor_names',
  // ByPastorLastNames = 'by_pastor_last_names',
  // ByPastorFullName = 'by_pastor_full_name',

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
  // OfferingByChurch = 'offering_by_church',
  // OfferingByChurchDate = 'offering_by_church_date',

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
  PrivateMobilityRental = 'private_mobility_rental',
  EducationalMaterials = 'educational_materials',
  GiftsAndPrizesParticipants = 'gifts_and_prizes_participants',
  OtherRelatedExpenses = 'other_related_expenses',

  //? Users
  // UserByNames = 'user_by_names',
  // UserByLastNames = 'user_by_last_names',
  // UserByFullName = 'user_by_full_name',
  // UserByRoles = 'user_by_roles',
}

export const SearchSubTypeNames: Record<SearchSubType, string> = {
  [SearchSubType.DiscipleByPastorNames]: 'Por nombres de su pastor',
  [SearchSubType.DiscipleByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.DiscipleByPastorFullName]:
    'Por nombres y apellidos de su pastor',
  [SearchSubType.DiscipleByCopastorNames]: 'Por nombres de su co-pastor',
  [SearchSubType.DiscipleByCopastorLastNames]: 'Por apellidos de su co-pastor',
  [SearchSubType.DiscipleByCopastorFullName]:
    'Por nombres y apellidos de su co-pastor',
  [SearchSubType.DiscipleBySupervisorNames]: 'Por nombres de su supervisor',
  [SearchSubType.DiscipleBySupervisorLastNames]:
    'Por apellidos de su supervisor',
  [SearchSubType.DiscipleBySupervisorFullName]:
    'Por nombres y apellidos de su supervisor',
  [SearchSubType.DiscipleByPreacherNames]: 'Por nombres de su predicador',
  [SearchSubType.DiscipleByPreacherLastNames]: 'Por apellidos de su predicador',
  [SearchSubType.DiscipleByPreacherFullName]:
    'Por nombres y apellidos de su predicador',
  [SearchSubType.ByDiscipleNames]: 'Por sus nombres',
  [SearchSubType.ByDiscipleLastNames]: 'Por sus apellidos',
  [SearchSubType.ByDiscipleFullName]: 'Por sus nombres y apellidos',

  [SearchSubType.CopastorByPastorNames]: 'Por nombres de su pastor',
  [SearchSubType.CopastorByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.CopastorByPastorFullName]:
    'Por nombres y apellidos de su pastor',
  [SearchSubType.ByCopastorNames]: 'Por sus nombres',
  [SearchSubType.ByCopastorLastNames]: 'Por sus apellidos',
  [SearchSubType.ByCopastorFullName]: 'Por sus nombres y apellidos',

  [SearchSubType.SupervisorByPastorNames]: 'Por nombres de su pastor',
  [SearchSubType.SupervisorByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.SupervisorByPastorFullName]:
    'Por nombres y apellidos de su pastor',
  [SearchSubType.SupervisorByCopastorNames]: 'Por nombres de su co-pastor',
  [SearchSubType.SupervisorByCopastorLastNames]:
    'Por apellidos de su co-pastor',
  [SearchSubType.SupervisorByCopastorFullName]:
    'Por nombres y apellidos de su co-pastor',
  [SearchSubType.BySupervisorNames]: 'Por sus nombres',
  [SearchSubType.BySupervisorLastNames]: 'Por sus apellidos',
  [SearchSubType.BySupervisorFullName]: 'Por sus nombres y apellidos',

  [SearchSubType.PreacherByPastorNames]: 'Por nombres de su pastor',
  [SearchSubType.PreacherByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.PreacherByPastorFullName]:
    'Por nombres y apellidos de su pastor',
  [SearchSubType.PreacherByCopastorNames]: 'Por nombres de su co-pastor',
  [SearchSubType.PreacherByCopastorLastNames]: 'Por apellidos de su co-pastor',
  [SearchSubType.PreacherByCopastorFullName]:
    'Por nombres y apellidos de su co-pastor',
  [SearchSubType.PreacherBySupervisorNames]: 'Por nombres de su supervisor',
  [SearchSubType.PreacherBySupervisorLastNames]:
    'Por apellidos de su supervisor',
  [SearchSubType.PreacherBySupervisorFullName]:
    'Por nombres y apellidos de su supervisor',
  [SearchSubType.ByPreacherNames]: 'Por sus nombres',
  [SearchSubType.ByPreacherLastNames]: 'Por sus apellidos',
  [SearchSubType.ByPreacherFullName]: 'Por sus nombres y apellidos',

  [SearchSubType.FamilyGroupByPastorNames]: 'Por nombres de su pastor',
  [SearchSubType.FamilyGroupByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.FamilyGroupByPastorFullName]:
    'Por nombres y apellidos de su pastor',
  [SearchSubType.FamilyGroupByCopastorNames]: 'Por nombres de su co-pastor',
  [SearchSubType.FamilyGroupByCopastorLastNames]:
    'Por apellidos de su co-pastor',
  [SearchSubType.FamilyGroupByCopastorFullName]:
    'Por nombres y apellidos de su co-pastor',
  [SearchSubType.FamilyGroupBySupervisorNames]: 'Por nombres de su supervisor',
  [SearchSubType.FamilyGroupBySupervisorLastNames]:
    'Por apellidos de su supervisor',
  [SearchSubType.FamilyGroupBySupervisorFullName]:
    'Por nombres y apellidos de su supervisor',
  [SearchSubType.FamilyGroupByPreacherNames]: 'Por nombres de su predicador',
  [SearchSubType.FamilyGroupByPreacherLastNames]:
    'Por apellidos de su predicador',
  [SearchSubType.FamilyGroupByPreacherFullName]:
    'Por nombres y apellidos de su predicador',

  [SearchSubType.OfferingByDate]: 'Por fecha',
  // [SearchSubType.OfferingByChurch]: 'Por iglesia',
  // [SearchSubType.OfferingByChurchDate]: 'Por fecha e iglesia',

  // Sunday service, youngs, school sunday
  [SearchSubType.OfferingByShift]: 'Por turno',
  [SearchSubType.OfferingByShiftDate]: 'Por fecha y turno',

  // Family House, Fasting Zonal, Vigil Zonal
  [SearchSubType.OfferingByZone]: 'Por zona',
  [SearchSubType.OfferingByZoneDate]: 'Por zona y fecha',

  // Family House
  [SearchSubType.OfferingByPreacherNames]: 'Por nombres de su predicador',
  [SearchSubType.OfferingByPreacherLastNames]: 'Por apellidos de su predicador',
  [SearchSubType.OfferingByPreacherFullName]:
    'Por nombres y apellidos de su predicador',
  [SearchSubType.OfferingByGroupCode]: 'Por código de grupo fam.',
  [SearchSubType.OfferingByGroupCodeDate]: 'Por código de grupo fam. y fecha',

  // Offering Ayuno Zonal y Vigilia Zonal
  [SearchSubType.OfferingBySupervisorNames]: 'Por nombres de su supervisor',
  [SearchSubType.OfferingBySupervisorLastNames]:
    'Por apellidos de su supervisor',
  [SearchSubType.OfferingBySupervisorFullName]:
    'Por nombres y apellidos de su supervisor',

  // Offering Ground Church and Special
  [SearchSubType.OfferingByContributorNames]: 'Por nombres del aportante',
  [SearchSubType.OfferingByContributorLastNames]: 'Por apellidos del aportante',
  [SearchSubType.OfferingByContributorFullName]:
    'Por nombres y apellidos del aportante',

  // Operative Expenses
  [SearchSubType.VenueRental]: 'Alquiler de local',
  [SearchSubType.PublicServices]: 'Servicios públicos',
  [SearchSubType.InsuranceAndTaxes]: 'Seguros y/o impuestos',
  [SearchSubType.TransportationAndTravelAllowance]: 'Transporte y/o viáticos',
  [SearchSubType.SecurityAndSurveillance]: 'Seguridad y vigilancia',
  [SearchSubType.OtherAdministrativeExpenses]: 'Otros gastos administrativos',

  // Maintenance and Repair Expenses
  [SearchSubType.PlumbingServices]: 'Servicios de gasfiteria',
  [SearchSubType.ElectricalServices]: 'Servicios de electricidad',
  [SearchSubType.PaintingAndTouchUpsServices]:
    'Servicios de pintura y retoques',
  [SearchSubType.CleaningServices]: 'Servicios de limpieza',
  [SearchSubType.HeatingAndACSystemMaintenance]: 'Mantenimiento de SC y AC',
  [SearchSubType.SoundAndLightingEquipmentMaintenance]:
    'Mant. Equipos de sonido e iluminación',
  [SearchSubType.GardenAndExteriorMaintenance]: 'Mant. Jardines y exteriores',
  [SearchSubType.FurnitureRepairAndMaintenance]: 'Mant. Muebles',
  [SearchSubType.ComputerEquipmentRepairAndMaintenance]:
    'Mant. Equipos informáticos',
  [SearchSubType.GeneralEquipmentMaintenance]: 'Mant. Equipos en general',
  [SearchSubType.GeneralEquipmentRepairs]: 'Rep. Equipos en general',
  [SearchSubType.RoofAndStructuralRepairs]: 'Rep. Techo y estructuras',
  [SearchSubType.DoorAndWindowRepairs]: 'Rep. Puertas y ventanas',
  [SearchSubType.SoundAndLightingEquipmentRepairs]:
    'Rep. Equipos de sonido e iluminación',

  // Decoration Expenses
  [SearchSubType.PurchaseFlowersAndPlants]: 'Adq. Flores y plantas',
  [SearchSubType.PurchaseDecorativeFurniture]: 'Adq. Muebles decorativos',
  [SearchSubType.PurchaseDecorativeItems]: 'Adq. Artículos decorativos',
  [SearchSubType.DecorationServices]: 'Serv. Decoración general',
  [SearchSubType.LightingAndIlluminationServices]:
    'Serv. Iluminación y efectos',
  [SearchSubType.StageSetupServices]: 'Serv. Montaje de escenario',
  [SearchSubType.EventDecorationRentals]: 'Alq. Decoraciones especiales',
  [SearchSubType.CleaningPostEventServices]: 'Serv. Limpieza post-evento',

  // Equipment and Technology Expenses
  [SearchSubType.SoundEquipment]: 'Equipos de sonido',
  [SearchSubType.ProjectionEquipment]: 'Equipos de proyección',
  [SearchSubType.HvacEquipment]: 'Equipos de ventilación, SC y AC',
  [SearchSubType.LightingEquipment]: 'Equipos de iluminación',
  [SearchSubType.SecurityEquipment]: 'Equipos de seguridad',
  [SearchSubType.OfficeEquipment]: 'Equipos de oficina',
  [SearchSubType.ComputerEquipment]: 'Equipos informáticos',
  [SearchSubType.KitchenEquipment]: 'Equipos de cocina',
  [SearchSubType.CleaningEquipment]: 'Equipos de limpieza',
  [SearchSubType.AudioVideoRecordingEquipment]: 'Equipos de grabación (a/v)',
  [SearchSubType.OfficeFurniture]: 'Mobiliarios informáticos',
  [SearchSubType.KitchenFurniture]: 'Mobiliarios de cocina',
  [SearchSubType.GeneralFurniture]: 'Mobiliarios en general',
  [SearchSubType.MusicalInstruments]: 'Instrumentos musicales',
  [SearchSubType.InternetTelephoneServices]: 'Serv. Internet y telefonía',
  [SearchSubType.HostingSoftwareServices]: 'Serv. Hosting y software',

  // Supplies Expenses
  [SearchSubType.KitchenUtensils]: 'Utensilios de cocina',
  [SearchSubType.CookingIngredients]: 'Insumos de cocina',
  [SearchSubType.OfficeSupplies]: 'Utensilios de oficina',
  [SearchSubType.CleaningMaterials]: 'Materiales de limpieza',
  [SearchSubType.PackagingMaterials]: 'Materiales de almacenamiento',
  [SearchSubType.SundaySchoolMaterials]: 'Material educativo (Esc. Dom.)',

  // Planing Events Expenses
  [SearchSubType.AdvertisingAndEventPromotion]:
    'Publicidad y promoción de eventos',
  [SearchSubType.SpecialGuestsFees]: 'Hon. Invitados especiales',
  [SearchSubType.SupportStaffFees]: 'Hon. Personal de apoyo',
  [SearchSubType.SecurityPersonnelFees]: 'Hon. Personal de seguridad',
  [SearchSubType.ExternalVenueRental]: 'Alq. Local externo',
  [SearchSubType.RentalTechnicalEquipment]: 'Alq. Equipos técnicos',
  [SearchSubType.TransportationSpecialGuests]: 'Trans. Invitados especiales',
  [SearchSubType.EquipmentTransportation]: 'Trans. Equipos',
  [SearchSubType.PrivateMobilityRental]: 'Alq. Movilidad particular',
  [SearchSubType.FoodAndBeverage]: 'Alimentación y bebida',
  [SearchSubType.EducationalMaterials]: 'Material didáctico',
  [SearchSubType.GiftsAndPrizesParticipants]: 'Premios y regalos',
  [SearchSubType.OtherRelatedExpenses]: 'Otros gastos relacionados',
};
