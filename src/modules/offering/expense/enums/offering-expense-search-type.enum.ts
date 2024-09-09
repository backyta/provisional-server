export enum OfferingExpenseSearchType {
  OperationalExpense = 'operative_expense',
  MaintenanceAndRepairExpense = 'maintenance_and_repair_expense',
  DecorationExpense = 'decoration_expense',
  EquipmentAndTechnologyExpense = 'equipment_and_technology_expense',
  SuppliesExpense = 'supplies_expense',
  ActivitiesAndEventsExpense = 'activities_and_events_expense',
  ExpenseAdjustment = 'expense_adjustment',
  RecordStatus = 'record_status',
}

export const OfferingExpenseSearchTypeNames: Record<
  OfferingExpenseSearchType,
  string
> = {
  [OfferingExpenseSearchType.OperationalExpense]: 'Gastos de operación',
  [OfferingExpenseSearchType.MaintenanceAndRepairExpense]:
    'Gastos de reparación y mantenimiento',
  [OfferingExpenseSearchType.DecorationExpense]: 'Gastos de decoración',
  [OfferingExpenseSearchType.EquipmentAndTechnologyExpense]:
    'Gastos de equipamiento y tecnología',
  [OfferingExpenseSearchType.SuppliesExpense]: 'Gastos de suministros',
  [OfferingExpenseSearchType.ActivitiesAndEventsExpense]:
    'Gastos de actividades y eventos',
  [OfferingExpenseSearchType.ExpenseAdjustment]: 'Ajuste por Salida',
  [OfferingExpenseSearchType.RecordStatus]: 'Estado de Registro',
};
