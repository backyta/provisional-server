export enum OfferingExpenseSearchSubType {
  //* Operative Expenses
  VenueRental = 'venue_rental',
  PublicServices = 'public_services',
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
  AdvertisingAndEventPromotion = 'advertising_and_event_promotion',
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
}

export const OfferingExpenseSearchSubTypeNames: Record<
  OfferingExpenseSearchSubType,
  string
> = {
  //* Operative Expenses
  [OfferingExpenseSearchSubType.VenueRental]: 'Alquiler de local',
  [OfferingExpenseSearchSubType.PublicServices]: 'Servicios públicos',
  [OfferingExpenseSearchSubType.TravelAndTransportation]: 'Viaje y transporte',
  [OfferingExpenseSearchSubType.SecurityAndSurveillance]:
    'Seguridad y vigilancia',
  [OfferingExpenseSearchSubType.OtherAdministrativeExpenses]:
    'Otros gastos administrativos',

  //* Maintenance and Repair Expenses
  [OfferingExpenseSearchSubType.PlumbingServices]: 'Servicios de gasfiteria',
  [OfferingExpenseSearchSubType.ElectricalServices]:
    'Servicios de electricidad',
  [OfferingExpenseSearchSubType.PaintingAndTouchUpsServices]:
    'Servicios de pintura y retoques',
  [OfferingExpenseSearchSubType.DeepCleaningServices]:
    'Servicios de limpieza profunda',
  [OfferingExpenseSearchSubType.HeatingAndACSystemMaintenance]:
    'Mantenimiento de sistemas de calefacción y AC',
  [OfferingExpenseSearchSubType.SoundAndLightingEquipmentRepairAndMaintenance]:
    'Mantenimiento de equipos de sonido e iluminación',
  [OfferingExpenseSearchSubType.GardenAndExteriorMaintenance]:
    'Mantenimiento de jardines y exteriores',
  [OfferingExpenseSearchSubType.FurnitureRepairAndMaintenance]:
    'Mantenimiento de muebles',
  [OfferingExpenseSearchSubType.ComputerEquipmentRepairAndMaintenance]:
    'Mantenimiento de equipos informáticos',
  [OfferingExpenseSearchSubType.OtherEquipmentRepairsAndMaintenance]:
    'Mantenimiento de otros equipos',
  [OfferingExpenseSearchSubType.RoofAndStructuralRepairs]:
    'Reparación de techo y estructuras',
  [OfferingExpenseSearchSubType.DoorAndWindowRepairs]:
    'Reparación de puertas y ventanas',

  //* Decoration Expenses
  [OfferingExpenseSearchSubType.PurchaseFlowersAndPlants]:
    'Adquisición de flores y plantas',
  [OfferingExpenseSearchSubType.PurchaseDecorativeFurniture]:
    'Adquisición de muebles decorativos',
  [OfferingExpenseSearchSubType.PurchaseDecorativeItems]:
    'Adquisición de elementos decorativos',
  [OfferingExpenseSearchSubType.AltarAndWorshipAreaDecorationService]:
    'Servicio de decoración de altar y áreas de culto',

  //* Equipment and Technology Expenses
  [OfferingExpenseSearchSubType.SoundEquipment]: 'Equipos de sonido',
  [OfferingExpenseSearchSubType.ProjectionEquipment]: 'Equipos de proyección',
  [OfferingExpenseSearchSubType.HvacEquipment]:
    'Equipos de ventilación, calefacción y AC',
  [OfferingExpenseSearchSubType.LightingEquipment]: 'Equipos de iluminación',
  [OfferingExpenseSearchSubType.SecurityEquipment]: 'Equipos de seguridad',
  [OfferingExpenseSearchSubType.OfficeEquipment]: 'Equipos de oficina',
  [OfferingExpenseSearchSubType.ComputerEquipment]: 'Equipos informáticos',
  [OfferingExpenseSearchSubType.AudioVideoRecordingEquipment]:
    'Equipos de grabación de audio/video',
  [OfferingExpenseSearchSubType.Furniture]: 'Mobiliario',
  [OfferingExpenseSearchSubType.MusicalInstruments]: 'Instrumentos musicales',
  [OfferingExpenseSearchSubType.InternetTelecommunicationsServices]:
    'Servicios de internet y telecomunicaciones',
  [OfferingExpenseSearchSubType.HostingSoftwareServices]:
    'Servicios de Hosting y Software',

  //* Supplies Expenses
  [OfferingExpenseSearchSubType.KitchenUtensils]: 'Utensilios de cocina',
  [OfferingExpenseSearchSubType.CookingIngredients]: 'Ingredientes de cocina',
  [OfferingExpenseSearchSubType.OfficeSupplies]: 'Utensilios de oficina',
  [OfferingExpenseSearchSubType.CleaningMaterials]: 'Materiales de limpieza',
  [OfferingExpenseSearchSubType.PackagingMaterials]:
    'Materiales de almacenamiento',
  [OfferingExpenseSearchSubType.SundaySchoolMaterials]:
    'Material educativo Esc. Dominical',

  //* Activities and Events Expenses
  [OfferingExpenseSearchSubType.AdvertisingAndEventPromotion]:
    'Publicidad y promoción de eventos',
  [OfferingExpenseSearchSubType.SpecialGuestFees]:
    'Honorarios para invitados especiales',
  [OfferingExpenseSearchSubType.SupportStaffFees]:
    'Honorarios de personal de apoyo',
  [OfferingExpenseSearchSubType.ExternalVenueRental]:
    'Alquiler de locales externos',
  [OfferingExpenseSearchSubType.RentalTechnicalAndLogisticEquipment]:
    'Alquiler de equipos técnicos y logísticos',
  [OfferingExpenseSearchSubType.TransportationSpecialGuests]:
    'Transporte para invitados especiales',
  [OfferingExpenseSearchSubType.EquipmentTransportation]:
    'Transporte de equipos',
  [OfferingExpenseSearchSubType.FoodAndBeverage]: 'Comida y bebida',
  [OfferingExpenseSearchSubType.DecorationsAndAmbiance]:
    'Decoraciones y ambientación',
  [OfferingExpenseSearchSubType.PromotionalMaterials]: 'Material promocional',
  [OfferingExpenseSearchSubType.EducationalMaterialsAndResources]:
    'Material didáctico y recursos',
  [OfferingExpenseSearchSubType.GiftsAndPrizesParticipants]:
    'Regalos y premios para participantes',
  [OfferingExpenseSearchSubType.OtherRelatedExpenses]:
    'Otros gastos relacionados',
};
