export enum SupervisorSearchType {
  FirstName = 'first_name',
  LastName = 'last_name',
  FullName = 'full_name',
  BirthDate = 'birth_date',
  BirthMonth = 'birth_month',
  Gender = 'gender',
  MaritalStatus = 'marital_status',
  OriginCountry = 'origin_country',
  ZoneName = 'zone_name',
  Department = 'department',
  Province = 'province',
  District = 'district',
  UrbanSector = 'urban_sector',
  Address = 'address',
  RecordStatus = 'record_status',
  CopastorId = 'copastor_id',
}

export const SupervisorSearchTypeNames: Partial<
  Record<SupervisorSearchType, string>
> = {
  [SupervisorSearchType.FirstName]: 'Nombres',
  [SupervisorSearchType.LastName]: 'Apellidos',
  [SupervisorSearchType.FullName]: 'Nombres y Apellidos',
  [SupervisorSearchType.BirthDate]: 'Fecha de nacimiento',
  [SupervisorSearchType.BirthMonth]: 'Mes de nacimiento',
  [SupervisorSearchType.Gender]: 'Género',
  [SupervisorSearchType.MaritalStatus]: 'Estado civil',
  [SupervisorSearchType.OriginCountry]: 'País de origen',
  [SupervisorSearchType.ZoneName]: 'Nombre de Zona',
  [SupervisorSearchType.Department]: 'Departamento',
  [SupervisorSearchType.Province]: 'Provincia',
  [SupervisorSearchType.District]: 'Distrito',
  [SupervisorSearchType.UrbanSector]: 'Sector Urbano',
  [SupervisorSearchType.Address]: 'Dirección',
  [SupervisorSearchType.RecordStatus]: 'Estado de registro',
};
