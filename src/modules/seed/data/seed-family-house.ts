interface SeedFamilyHome {
  //* General Info
  houseName: string;
  zoneName?: string;
  houseNumber?: string;
  codeHouse?: string;
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

interface SeedDataHouses {
  houses: SeedFamilyHome[];
}

//! Data Family Houses
export const dataFamilyHouses: SeedDataHouses = {
  houses: [
    {
      houseName: 'Faro de Luz',
      worshipTime: '17:00',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Jr. Los Pinos 123',
      referenceAddress: 'Frente al parque zonal',
    },
    {
      houseName: 'Bethel',
      worshipTime: '18:00',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Av. Los Girasoles 456',
      referenceAddress: 'Cerca del mercado municipal',
    },
    {
      houseName: 'Monte Sion',
      worshipTime: '19:00',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Jr. Las Acacias 789',
      referenceAddress: 'A una cuadra del colegio',
    },
    {
      houseName: 'Renuevo Espiritual',
      worshipTime: '20:00',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Av. Las Hortensias 890',
      referenceAddress: 'Frente al parque industrial',
    },
    {
      houseName: 'Centro Cristiano',
      worshipTime: '10:00',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Av. Los Laureles 234',
      referenceAddress: 'Cerca del centro educativo',
    },
    {
      houseName: 'Puerta del Cielo',
      worshipTime: '17:00',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Jr. Las Orquídeas 567',
      referenceAddress: 'Frente al mercado municipal',
    },
    {
      houseName: 'Manantial de Vida',
      worshipTime: '18:00',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Av. Los Nogales 890',
      referenceAddress: 'Cerca del parque zonal',
    },
    {
      houseName: 'Cristo Vive',
      worshipTime: '19:00',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Jr. Las Rosas 123',
      referenceAddress: 'Frente a la plaza central',
    },
    {
      houseName: 'Nueva Esperanza',
      worshipTime: '20:00',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Av. Las Margaritas 456',
      referenceAddress: 'Cerca del centro comercial',
    },
    {
      houseName: 'Iglesia de la Paz',
      worshipTime: '10:00',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Jr. Los Jazmines 789',
      referenceAddress: 'Frente a la estación central',
    },
    {
      houseName: 'Renacer Espiritual',
      worshipTime: '17:00',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Av. Los Cedros 678',
      referenceAddress: 'Cerca del centro de salud',
    },
    {
      houseName: 'Gracia y Paz',
      worshipTime: '18:00',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Jr. Las Orquídeas 890',
      referenceAddress: 'Frente al parque zonal',
    },
    {
      houseName: 'Luz Eterna',
      worshipTime: '19:00',
      district: 'Independencia',
      urbanSector: 'Payet',
      address: 'Av. Los Laureles 123',
      referenceAddress: 'Frente al centro educativo',
    },
    {
      houseName: 'Roca Firme',
      worshipTime: '20:00',
      district: 'Independencia',
      urbanSector: 'Tahuantinsuyo',
      address: 'Jr. Los Pinos 456',
      referenceAddress: 'Cerca del mercado municipal',
    },
    {
      houseName: 'Iglesia de Amor',
      worshipTime: '10:00',
      district: 'Independencia',
      urbanSector: 'Ermitaño',
      address: 'Av. Las Margaritas 789',
      referenceAddress: 'Frente a la estación de policía',
    },
  ],
};
