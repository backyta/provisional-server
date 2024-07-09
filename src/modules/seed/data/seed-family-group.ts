interface SeedFamilyGroup {
  //* General Info
  familyGroupName: string;
  zoneName?: string;
  familyGroupNumber?: string;
  familyGroupCode?: string;
  worshipTime: string;

  //* Contact info
  country?: string;
  department?: string;
  province?: string;
  district: string;
  urbanSector: string;
  address: string;
  referenceAddress: string;
  status?: string;

  //* Relations
  theirPreacher?: string;
  theirZone?: string;
}

interface SeedDataGroups {
  houses: SeedFamilyGroup[];
}

//! Data Family Houses
export const dataFamilyGroups: SeedDataGroups = {
  houses: [
    {
      familyGroupName: 'Faro de Luz',
      worshipTime: '17:00',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Jr. Los Pinos 123',
      referenceAddress: 'Frente al parque zonal',
    },
    {
      familyGroupName: 'Bethel',
      worshipTime: '18:00',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Av. Los Girasoles 456',
      referenceAddress: 'Cerca del mercado municipal',
    },
    {
      familyGroupName: 'Monte Sion',
      worshipTime: '19:00',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Jr. Las Acacias 789',
      referenceAddress: 'A una cuadra del colegio',
    },
    {
      familyGroupName: 'Renuevo Espiritual',
      worshipTime: '20:00',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Av. Las Hortensias 890',
      referenceAddress: 'Frente al parque industrial',
    },
    {
      familyGroupName: 'Centro Cristiano',
      worshipTime: '10:00',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Av. Los Laureles 234',
      referenceAddress: 'Cerca del centro educativo',
    },
    {
      familyGroupName: 'Puerta del Cielo',
      worshipTime: '17:00',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Jr. Las Orquídeas 567',
      referenceAddress: 'Frente al mercado municipal',
    },
    {
      familyGroupName: 'Manantial de Vida',
      worshipTime: '18:00',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Av. Los Nogales 890',
      referenceAddress: 'Cerca del parque zonal',
    },
    {
      familyGroupName: 'Cristo Vive',
      worshipTime: '19:00',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Jr. Las Rosas 123',
      referenceAddress: 'Frente a la plaza central',
    },
    {
      familyGroupName: 'Nueva Esperanza',
      worshipTime: '20:00',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Av. Las Margaritas 456',
      referenceAddress: 'Cerca del centro comercial',
    },
    {
      familyGroupName: 'Iglesia de la Paz',
      worshipTime: '10:00',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Jr. Los Jazmines 789',
      referenceAddress: 'Frente a la estación central',
    },
  ],
};
