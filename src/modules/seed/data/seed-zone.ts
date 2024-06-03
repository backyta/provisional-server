interface SeedZone {
  //* General Info
  zoneName: string;
  country?: string;
  department?: string;
  province?: string;
  district: string;
  status?: string;

  //* Relations
  theirSupervisor?: string;
}

interface SeedDataZones {
  zones: SeedZone[];
}

export const dataZones: SeedDataZones = {
  zones: [
    {
      zoneName: 'Rubén',
      district: 'Independencia',
    },
    {
      zoneName: 'Simeón',
      district: 'Independencia',
    },
    {
      zoneName: 'Leví',
      district: 'Independencia',
    },
    {
      zoneName: 'Judá',
      district: 'Independencia',
    },
    {
      zoneName: 'Isacar',
      district: 'Independencia',
    },
    {
      zoneName: 'Zabulón',
      district: 'Independencia',
    },
    {
      zoneName: 'Dan',
      district: 'Independencia',
    },
    {
      zoneName: 'Gad',
      district: 'Independencia',
    },
    {
      zoneName: 'Aser',
      district: 'Independencia',
    },
    {
      zoneName: 'Neftalí',
      district: 'Independencia',
    },
    {
      zoneName: 'Efraín',
      district: 'Independencia',
    },
    {
      zoneName: 'Manasés',
      district: 'Independencia',
    },
  ],
};
